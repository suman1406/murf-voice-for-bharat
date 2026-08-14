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
from call_analytics_db import (
    get_call_analytics,
    get_daily_chart_data,
    get_recent_calls,
    init_call_analytics_db,
)

logger = logging.getLogger("krishivani-server")

init_db()
init_call_analytics_db()

app = FastAPI(
    title="KrishiVani Day 8 — Call Analytics & Human Escalation API",
    description="REST API for call analytics dashboard and human help escalation requests.",
    version="2.0.0",
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
    return {"status": "ok", "service": "KrishiVani Day 8 Call Analytics & Escalation API"}


# ──────────────────────────────────────────────
# Call Analytics Endpoints (Day 8)
# ──────────────────────────────────────────────

@app.get("/api/analytics")
def analytics_summary():
    """Get aggregated call analytics: total, successful, failed, success rate."""
    try:
        data = get_call_analytics()
        return data
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/recent")
def analytics_recent(limit: int = Query(20, ge=1, le=100)):
    """Get recent call logs (no PII exposed)."""
    try:
        data = get_recent_calls(limit=limit)
        return data
    except Exception as e:
        logger.error(f"Error fetching recent calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/chart-data")
def analytics_chart(days: int = Query(7, ge=1, le=30)):
    """Get daily aggregated call data for charts."""
    try:
        data = get_daily_chart_data(days=days)
        return data
    except Exception as e:
        logger.error(f"Error fetching chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# Escalation Endpoints (from Day 7)
# ──────────────────────────────────────────────

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
