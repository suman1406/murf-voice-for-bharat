import datetime
import random
from typing import Any, Dict, Optional


def fetch_mandi_prices_sync(
    crop: str,
    district: str = "Karnal",
    state: Optional[str] = "Haryana",
    simulate_error: bool = False,
) -> Dict[str, Any]:
    """
    Returns realistic current mandi prices in INR (₹) per quintal for Indian crops.
    """
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    if simulate_error:
        return {
            "status": "error",
            "crop": crop,
            "district": district,
            "date": today_str,
            "message": f"Mandi server connection timed out for {district}.",
            "spoken_fallback": f"क्षमा कीजिए, {district} मंडी सर्वर से कनेक्ट करने में समस्या आ रही है। क्या आप मंडी अधिकारी से संपर्क के लिए मदद चाहते हैं?",
        }

    rates_db = {
        "wheat": {"min_price": 2275, "max_price": 2450, "modal_price": 2360, "unit": "₹/quintal", "hindi_name": "गेहूँ"},
        "गेहूँ": {"min_price": 2275, "max_price": 2450, "modal_price": 2360, "unit": "₹/quintal", "hindi_name": "गेहूँ"},
        "mustard": {"min_price": 5450, "max_price": 5800, "modal_price": 5650, "unit": "₹/quintal", "hindi_name": "सरसों"},
        "सरसों": {"min_price": 5450, "max_price": 5800, "modal_price": 5650, "unit": "₹/quintal", "hindi_name": "सरसों"},
        "paddy": {"min_price": 2183, "max_price": 2320, "modal_price": 2250, "unit": "₹/quintal", "hindi_name": "धान"},
        "धान": {"min_price": 2183, "max_price": 2320, "modal_price": 2250, "unit": "₹/quintal", "hindi_name": "धान"},
        "cotton": {"min_price": 6800, "max_price": 7400, "modal_price": 7100, "unit": "₹/quintal", "hindi_name": "कपास"},
        "कपास": {"min_price": 6800, "max_price": 7400, "modal_price": 7100, "unit": "₹/quintal", "hindi_name": "कपास"},
        "potato": {"min_price": 1200, "max_price": 1600, "modal_price": 1420, "unit": "₹/quintal", "hindi_name": "आलू"},
        "आलू": {"min_price": 1200, "max_price": 1600, "modal_price": 1420, "unit": "₹/quintal", "hindi_name": "आलू"},
    }

    crop_lower = crop.lower().strip()
    data = rates_db.get(crop_lower)

    if not data:
        for k, v in rates_db.items():
            if k in crop_lower:
                data = v
                break

    if not data:
        modal = random.randint(2000, 4500)
        data = {
            "min_price": modal - 150,
            "max_price": modal + 200,
            "modal_price": modal,
            "unit": "₹/quintal",
            "hindi_name": crop,
        }

    return {
        "status": "success",
        "crop": data["hindi_name"],
        "district": district,
        "state": state or "Haryana",
        "date": today_str,
        "min_price": data["min_price"],
        "max_price": data["max_price"],
        "modal_price": data["modal_price"],
        "unit": data["unit"],
    }


def fetch_weather_forecast_sync(
    district: str = "Karnal",
    state: Optional[str] = "Haryana",
    simulate_error: bool = False,
) -> Dict[str, Any]:
    """
    Returns realistic agricultural weather forecast.
    """
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    if simulate_error:
        return {
            "status": "error",
            "district": district,
            "date": today_str,
            "message": f"Weather telemetry service unreachable for {district}.",
            "spoken_fallback": f"माफ़ कीजिएगा, {district} के मौसम विभाग से कनेक्ट नहीं हो पा रहा है।",
        }

    return {
        "status": "success",
        "district": district,
        "state": state or "Haryana",
        "date": today_str,
        "temperature_celsius": 31,
        "humidity_percent": 72,
        "rainfall_probability_percent": 25,
        "wind_speed_kmh": 12,
        "advisory": "मौसम छिड़काव और हल्की सिंचाई के लिए अनुकूल है।",
    }
