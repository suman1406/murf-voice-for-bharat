import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import (
    create_escalation_db,
    get_escalations_db,
    init_db,
    update_escalation_status_db,
)

logger = logging.getLogger("krishivani-server")

init_db()

app = FastAPI(
    title="KrishiVani Human Help Escalation Service — Day 7",
    description="REST API for viewing and managing human help escalation requests for farmers.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResolveRequest(BaseModel):
    reference_id: str
    status: str = "RESOLVED"


class EscalationCreateRequest(BaseModel):
    user_id: str
    caller_name: Optional[str] = "Kisan"
    caller_phone: Optional[str] = "Not provided"
    preferred_contact_method: Optional[str] = "Phone Call"
    language: Optional[str] = "Hindi"
    issue_category: str = "severe_crop_problem"
    urgency: str = "HIGH"
    summary: str
    checked_by_agent: Optional[str] = ""
    user_consented: bool = True


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "KrishiVani Day 7 Human Escalation API"}


@app.get("/api/escalations")
def list_escalations(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, IN_PROGRESS, RESOLVED, ALL"),
    urgency: Optional[str] = Query(None, description="Filter by urgency: LOW, MEDIUM, HIGH, EMERGENCY, ALL"),
):
    try:
        escalations = get_escalations_db(status=status, urgency=urgency)
        return {"status": "success", "count": len(escalations), "data": escalations}
    except Exception as e:
        logger.error(f"Error fetching escalations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/escalations/resolve")
def resolve_escalation(req: ResolveRequest):
    try:
        res = update_escalation_status_db(req.reference_id, req.status)
        if res.get("status") == "error":
            raise HTTPException(status_code=404, detail=res.get("message"))
        return res
    except Exception as e:
        logger.error(f"Error resolving escalation {req.reference_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/escalations/create")
def create_escalation_endpoint(req: EscalationCreateRequest):
    try:
        res = create_escalation_db(
            user_id=req.user_id,
            caller_name=req.caller_name or "Kisan",
            caller_phone=req.caller_phone or "Not provided",
            preferred_contact_method=req.preferred_contact_method or "Phone Call",
            language=req.language or "Hindi",
            issue_category=req.issue_category,
            urgency=req.urgency,
            summary=req.summary,
            checked_by_agent=req.checked_by_agent or "",
            user_consented=req.user_consented,
        )
        return res
    except Exception as e:
        logger.error(f"Error creating escalation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
