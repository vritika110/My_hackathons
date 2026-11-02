import importlib
import json
from datetime import date, timedelta

import pytest
from aiosmtpd.controller import Controller
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/t.db")
    monkeypatch.delenv("BACKEND_API_KEY", raising=False)
    monkeypatch.setenv("ALERT_TIMEZONE", "UTC")
    import app.database, app.models, app.alerts, app.main
    for m in (app.database, app.models, app.alerts, app.main):
        importlib.reload(m)
    with TestClient(app.main.app) as c:
        yield c


def add(c, **kw):
    body = {"name": "HackX", "teamMembers": ["A", "B"], **kw}
    r = c.post("/api/hackathons", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_add_is_stored_and_listed(client):
    h = add(client, registrationDeadline="2026-12-01", prizePool="$5,000")
    rows = client.get("/api/hackathons").json()
    assert [r["id"] for r in rows] == [h["id"]]
    assert rows[0]["teamMembers"] == ["A", "B"]
    assert rows[0]["registrationDeadline"] == "2026-12-01"
    assert rows[0]["submissionDeadline"] == ""


def test_team_members_as_comma_string_and_blank_dates(client):
    h = add(client, teamMembers="x, y ,x", registrationDeadline="", submissionDeadline="")
    assert h["teamMembers"] == ["x", "y"]


def test_update_and_delete(client):
    h = add(client)
    r = client.put("/api/hackathons", json={"id": h["id"], "prizePool": "$1", "teamMembers": ["Z"]})
    assert r.json()["prizePool"] == "$1" and r.json()["teamMembers"] == ["Z"]
    assert r.json()["name"] == "HackX"  # untouched field survives
    assert client.put("/api/hackathons", json={"id": "nope"}).status_code == 404
    assert client.delete("/api/hackathons", params={"id": h["id"]}).json() == {"success": True}
    assert client.get("/api/hackathons").json() == []


def test_api_key_enforced(client, monkeypatch):
    monkeypatch.setenv("BACKEND_API_KEY", "secret")
    assert client.get("/api/hackathons").status_code == 401
    assert client.get("/api/hackathons", headers={"X-API-Key": "secret"}).status_code == 200


# ---------- AI extraction (Gemini call mocked; everything around it is real) ----------
def test_extract_parses_fenced_json_and_normalises_dates(client, monkeypatch):
    from app import extract
    fake = '```json\n{"name":"ETH Demo","registrationDeadline":"Nov 20, 2026","submissionDeadline":"2026-11-22",' \
           '"prizePool":"$75,000","teamMembers":["Asha"],"platform":null}\n```'
    monkeypatch.setattr(extract, "call_gemini", lambda b, m: fake)
    r = client.post("/api/extract", files={"image": ("a.png", b"\x89PNG....", "image/png")})
    assert r.status_code == 200
    e = r.json()["extracted"]
    assert e["name"] == "ETH Demo" and e["registrationDeadline"] == "2026-11-20"
    assert e["teamMembers"] == ["Asha"] and e["platform"] == ""


def test_extract_without_key_gives_clear_error(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    r = client.post("/api/extract", files={"image": ("a.png", b"abc", "image/png")})
    assert r.status_code == 503 and "GEMINI_API_KEY" in r.json()["detail"]


# ---------- Email alerts ----------
def test_alert_selects_only_deadlines_in_window(client):
    t = date.today()
    add(client, name="soon", registrationDeadline=(t + timedelta(days=2)).isoformat())
    add(client, name="today", submissionDeadline=t.isoformat())
    add(client, name="far", registrationDeadline=(t + timedelta(days=10)).isoformat())
    add(client, name="past", registrationDeadline=(t - timedelta(days=1)).isoformat())
    from app import alerts
    from app.database import SessionLocal
    with SessionLocal() as db:
        names = [i["name"] for i in alerts.find_approaching(db)]
    assert names == ["today", "soon"]


def test_alert_really_sends_via_smtp(client, monkeypatch):
    """Starts a real local SMTP server and checks the mail actually arrives."""
    inbox = []

    class H:
        async def handle_DATA(self, server, session, envelope):
            inbox.append(envelope)
            return "250 OK"

    ctl = Controller(H(), hostname="127.0.0.1", port=8025)
    ctl.start()
    try:
        for k, v in dict(SMTP_HOST="127.0.0.1", SMTP_PORT="8025", SMTP_STARTTLS="false",
                         SMTP_USER="me@test.com", SMTP_PASS="x", ALERT_EMAIL="me@test.com").items():
            monkeypatch.setenv(k, v)
        # aiosmtpd test server has no AUTH -> skip login for this local check
        import smtplib
        monkeypatch.setattr(smtplib.SMTP, "login", lambda *a, **k: None)
        add(client, name="Urgent <b>Hack</b>", registrationDeadline=(date.today() + timedelta(days=1)).isoformat())
        r = client.get("/api/alerts")
        assert r.status_code == 200 and r.json()["sent"] is True
        assert len(inbox) == 1
        body = inbox[0].content.decode()
        assert "Urgent" in body and "&lt;b&gt;Hack&lt;/b&gt;" in body  # HTML part is escaped
        r = client.get("/api/alerts", params={"test": "true"})
        assert r.json()["sent"] is True and len(inbox) == 2
    finally:
        ctl.stop()


def test_alert_without_smtp_config_reports_error_not_fake_success(client, monkeypatch):
    for k in ("SMTP_USER", "SMTP_PASS"):
        monkeypatch.delenv(k, raising=False)
    add(client, registrationDeadline=date.today().isoformat())
    r = client.get("/api/alerts")
    assert r.status_code == 503 and r.json()["sent"] is False
