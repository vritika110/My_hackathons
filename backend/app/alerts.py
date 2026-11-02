"""Deadline e-mail alerts (stdlib smtplib - no extra dependency)."""
import html
import os
import smtplib
from datetime import date, datetime
from email.message import EmailMessage
from typing import List, Optional
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Hackathon


class AlertError(Exception):
    def __init__(self, message: str, status: int = 500):
        super().__init__(message)
        self.status = status


def today_local() -> date:
    tz = os.getenv("ALERT_TIMEZONE", "Asia/Kolkata")
    return datetime.now(ZoneInfo(tz)).date()


def find_approaching(db: Session, today: Optional[date] = None) -> List[dict]:
    today = today or today_local()
    window = int(os.getenv("ALERT_DAYS", "3"))
    items = []
    for h in db.scalars(select(Hackathon)).all():
        for kind, d in (("registration", h.registration_deadline), ("submission", h.submission_deadline)):
            if d is None:
                continue
            left = (d - today).days
            if 0 <= left <= window:
                items.append({
                    "hackathonId": h.id,
                    "name": h.name,
                    "type": kind,
                    "daysLeft": left,
                    "deadline": d.isoformat(),
                })
    items.sort(key=lambda i: (i["daysLeft"], i["name"]))
    return items


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))


def recipient() -> str:
    return os.getenv("ALERT_EMAIL") or os.getenv("SMTP_USER") or ""


def send_email(subject: str, text: str, html_body: str) -> None:
    if not smtp_configured():
        raise AlertError(
            "Email is not configured: set SMTP_USER and SMTP_PASS (a Gmail App Password) on the backend.", 503
        )
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"HackTracker Alerts <{os.environ['SMTP_USER']}>"
    msg["To"] = recipient()
    msg.set_content(text)
    msg.add_alternative(html_body, subtype="html")

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    try:
        with smtplib.SMTP(host, port, timeout=20) as s:
            if os.getenv("SMTP_STARTTLS", "true").lower() == "true":
                s.starttls()
            s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
            s.send_message(msg)
    except smtplib.SMTPAuthenticationError:
        raise AlertError(
            "Gmail rejected the login. Use a 16-character App Password (not your normal password).", 502
        )
    except (smtplib.SMTPException, OSError) as e:
        raise AlertError(f"Could not send email: {e}", 502)


def _when(days: int) -> str:
    return "TODAY!" if days == 0 else "Tomorrow" if days == 1 else f"{days} days left"


def _render(items: List[dict]) -> tuple[str, str]:
    text = "\n".join(f"- {i['name']}: {i['type']} deadline {i['deadline']} ({_when(i['daysLeft'])})" for i in items)
    rows = "".join(
        f"<tr><td style='padding:8px'>{html.escape(i['name'])}</td>"
        f"<td style='padding:8px'>{'Registration' if i['type'] == 'registration' else 'Submission'}</td>"
        f"<td style='padding:8px;font-weight:bold'>{_when(i['daysLeft'])}</td>"
        f"<td style='padding:8px'>{i['deadline']}</td></tr>"
        for i in items
    )
    url = os.getenv("DASHBOARD_URL", "http://localhost:3000")
    body = (
        "<div style='font-family:Arial,sans-serif;max-width:600px'>"
        f"<h2>⚡ {len(items)} hackathon deadline(s) approaching</h2>"
        "<table border='0' cellspacing='0' style='width:100%;border-collapse:collapse'>"
        "<tr style='background:#eee;text-align:left'><th style='padding:8px'>Hackathon</th>"
        "<th style='padding:8px'>Type</th><th style='padding:8px'>Time left</th><th style='padding:8px'>Date</th></tr>"
        f"{rows}</table><p><a href='{html.escape(url)}'>Open HackTracker</a></p></div>"
    )
    return text, body


def run_check(db: Session, send_test: bool = False) -> dict:
    """Find deadlines <= ALERT_DAYS away and e-mail them. send_test=True sends a test mail regardless."""
    to = recipient()
    if send_test:
        send_email(
            "✅ HackTracker test email",
            "If you can read this, deadline alerts will reach you.",
            "<p>✅ <b>HackTracker</b> email alerts are working.</p>",
        )
        return {"message": f"Test email sent to {to}. Check your inbox (and Spam).",
                "approachingCount": 0, "items": [], "sent": True, "recipient": to}

    items = find_approaching(db)
    if not items:
        return {"message": "No deadlines within the next "
                           f"{os.getenv('ALERT_DAYS', '3')} days - nothing to send.",
                "approachingCount": 0, "items": [], "sent": False, "recipient": to}

    text, body = _render(items)
    send_email(f"⚡ {len(items)} hackathon deadline(s) approaching", text, body)
    return {"message": f"Alert email sent to {to} for {len(items)} deadline(s).",
            "approachingCount": len(items), "items": items, "sent": True, "recipient": to}


if __name__ == "__main__":  # python -m app.alerts   (handy for a plain server cron job)
    from .database import SessionLocal

    with SessionLocal() as s:
        print(run_check(s))
