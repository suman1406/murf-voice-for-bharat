import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from db import (
    get_caller_profile,
    save_caller_profile,
    forget_caller_profile,
    init_db,
)


@pytest.fixture
def test_db_path(tmp_path):
    db_file = os.path.join(tmp_path, "test_farmer_memory.db")
    init_db(db_file)
    return db_file


def test_save_without_consent(test_db_path):
    res = save_caller_profile(
        user_id="farmer_1",
        name="Ramesh",
        user_consented=False,
        db_path=test_db_path,
    )
    assert res["status"] == "denied"
    assert res["saved"] is False

    profile = get_caller_profile("farmer_1", db_path=test_db_path)
    assert profile is None


def test_save_with_consent_and_lookup(test_db_path):
    res = save_caller_profile(
        user_id="farmer_1",
        name="Ramesh",
        crops_grown="Cotton, Mustard",
        land_size="5 acres",
        district="Bathinda",
        irrigation_type="Tubewell",
        user_consented=True,
        db_path=test_db_path,
    )
    assert res["status"] == "success"
    assert res["saved"] is True

    profile = get_caller_profile("farmer_1", db_path=test_db_path)
    assert profile is not None
    assert profile["name"] == "Ramesh"
    assert profile["facts"]["crops_grown"] == "Cotton, Mustard"
    assert profile["facts"]["district"] == "Bathinda"


def test_forget_caller(test_db_path):
    save_caller_profile(
        user_id="farmer_2",
        name="Suresh",
        user_consented=True,
        db_path=test_db_path,
    )
    res = forget_caller_profile("farmer_2", db_path=test_db_path)
    assert res["status"] == "success"
    assert res["deleted"] is True

    profile = get_caller_profile("farmer_2", db_path=test_db_path)
    assert profile is None
