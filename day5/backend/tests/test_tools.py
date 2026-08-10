import os
import sys
import pytest

# Ensure src is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "src"))

from tools import fetch_mandi_prices_sync, fetch_weather_forecast_sync
from db import init_db, save_caller_profile, get_caller_profile, forget_caller_profile

TEST_DB_PATH = "test_farmer_memory.db"

@pytest.fixture(autouse=True)
def cleanup():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    yield
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

def test_fetch_mandi_prices_success():
    res = fetch_mandi_prices_sync(crop="Wheat", district="Karnal")
    assert res["status"] == "success"
    assert "Karnal" in res["district"]
    assert "modal_price_rs_per_quintal" in res
    assert "आज" in res["as_of_date"] or "2026" in res["as_of_date"]
    assert "spoken_summary" in res

def test_fetch_mandi_prices_failure_simulation():
    res = fetch_mandi_prices_sync(crop="Wheat", district="Karnal", simulate_error=True)
    assert res["status"] == "error"
    assert res["error_code"] == "SERVICE_UNAVAILABLE"
    assert "spoken_fallback" in res

def test_fetch_weather_forecast_live_success():
    res = fetch_weather_forecast_sync(district="Karnal")
    assert res["status"] == "success"
    assert "karn" in res["district"].lower()
    assert "current_temperature_c" in res
    assert "precipitation_probability_percent" in res
    assert "farmer_advisory" in res
    assert "spoken_summary" in res

def test_fetch_weather_forecast_failure_simulation():
    res = fetch_weather_forecast_sync(district="Karnal", simulate_error=True)
    assert res["status"] == "error"
    assert res["error_code"] == "SERVICE_UNAVAILABLE"
    assert "spoken_fallback" in res

def test_db_memory_operations():
    init_db(TEST_DB_PATH)
    # Consent true
    res_save = save_caller_profile(
        user_id="user_123",
        name="Ramesh Kumar",
        crops_grown="Wheat, Mustard",
        district="Karnal",
        user_consented=True,
        db_path=TEST_DB_PATH
    )
    assert res_save["status"] == "success"
    
    prof = get_caller_profile("user_123", db_path=TEST_DB_PATH)
    assert prof is not None
    assert prof["name"] == "Ramesh Kumar"
    assert prof["facts"]["district"] == "Karnal"
    
    # Forget
    res_forget = forget_caller_profile("user_123", db_path=TEST_DB_PATH)
    assert res_forget["status"] == "success"
    assert get_caller_profile("user_123", db_path=TEST_DB_PATH) is None
