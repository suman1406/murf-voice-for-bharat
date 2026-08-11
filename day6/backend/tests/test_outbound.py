import json
import pytest
from datetime import datetime

from db import (
    init_db,
    save_caller_profile,
    get_caller_profile,
    unsubscribe_farmer_alerts,
    is_farmer_opted_out,
    record_call_outcome,
    get_recent_call_outcomes,
)
from tools import fetch_mandi_prices_sync, fetch_weather_forecast_sync
from outbound_call import build_alert_metadata


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()


def test_opening_statement_compliance():
    """Verify that the opening statement meets Step 4 requirements: state who is calling, why, and opt out method."""
    meta = build_alert_metadata(
        farmer_name="रामेश्वर जी",
        district="करनाल (Karnal)",
        alert_type="heavy_rain_warning"
    )
    statement = meta["opening_statement"]
    
    # 1. State who is calling
    assert "कृषिवाणी" in statement
    assert "एआई किसान मित्र" in statement or "बोल रहा हूँ" in statement
    
    # 2. State why calling
    assert "करनाल" in statement
    assert "भारी बारिश" in statement or "चेतावनी" in statement
    
    # 3. State how to opt out
    assert "अनसब्सक्राइब" in statement or "कॉल बंद करो" in statement


def test_devanagari_script_rule():
    """Verify compulsory rule: Hindi text is in Devanagari script and not romanized."""
    meta = build_alert_metadata("रामेश्वर जी", "करनाल", "heavy_rain_warning")
    statement = meta["opening_statement"]
    
    # Ensure no common romanized Hindi words
    romanized_words = ["namaste", "kisan", "rameshwar", "barish", "mandi", "bhav"]
    for word in romanized_words:
        assert word not in statement.lower()


def test_unsubscribe_and_opt_out_flow():
    """Test farmer opt-out behavior and DB update."""
    user_id = "test_farmer_optout"
    save_caller_profile(user_id=user_id, name="सुरेश जी", phone="+919999988888")
    
    assert not is_farmer_opted_out(user_id)
    
    res = unsubscribe_farmer_alerts(user_id)
    assert res["status"] == "success"
    assert is_farmer_opted_out(user_id)


def test_outcome_recording_and_retries():
    """Test call outcome logging and retry schedule calculation."""
    call_id = "test_call_101"
    
    # Outcome 1: no_answer (should schedule retry in 30 mins)
    res1 = record_call_outcome(call_id, "farmer_001", "+919876543210", "heavy_rain_warning", "no_answer")
    assert res1["status"] == "success"
    assert res1["outcome"] == "no_answer"
    assert res1["next_retry_at"] is not None
    
    # Outcome 2: opt_out (should opt out farmer in DB)
    res2 = record_call_outcome("test_call_102", "farmer_001", "+919876543210", "heavy_rain_warning", "opt_out")
    assert res2["outcome"] == "opt_out"
    assert is_farmer_opted_out("farmer_001")


def test_mandi_and_weather_tools():
    """Test mandi and weather tool responses."""
    mandi_res = fetch_mandi_prices_sync("धान", district="करनाल")
    assert mandi_res["status"] == "success"
    assert "करनाल" in mandi_res["spoken_summary"]
    
    weather_res = fetch_weather_forecast_sync(district="करनाल")
    assert weather_res["status"] == "success"
    assert "करनाल" in weather_res["spoken_summary"]
