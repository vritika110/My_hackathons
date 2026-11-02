"""Screenshot -> hackathon fields, using Gemini Vision."""
import json
import os
import re
from datetime import datetime
from typing import Optional

from dateutil import parser as dateparser

PROMPT = """You are an expert OCR and data extractor for hackathon posters, ads and screenshots.
Today's date is {today}. If a date in the image has no year, choose the next occurrence on or after today.
Return ONLY a JSON object with exactly these keys:
{{
  "name": "name of the hackathon",
  "platform": "Devpost, Devfolio, Unstop, etc. or null",
  "platformUrl": "website URL or null",
  "registrationDeadline": "YYYY-MM-DD or null",
  "submissionDeadline": "YYYY-MM-DD or null",
  "prizePool": "total prize money / perks as text, or null",
  "teamMembers": ["names of team members if listed"] ,
  "description": "one or two sentence summary / theme, or null"
}}
If something is not visible in the image use null (or [] for teamMembers). Never invent dates."""


class ExtractionError(Exception):
    def __init__(self, message: str, status: int = 500):
        super().__init__(message)
        self.status = status


def normalise_date(value) -> str:
    if not value or not isinstance(value, str):
        return ""
    value = value.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value
    try:
        return dateparser.parse(value, fuzzy=True).date().isoformat()
    except (ValueError, OverflowError):
        return ""


def parse_model_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)  # model wrapped it in ```json fences
        if not m:
            raise ExtractionError("Could not read JSON from the AI response", 422)
        return json.loads(m.group(0))


def clean(data: dict) -> dict:
    team = data.get("teamMembers") or []
    if isinstance(team, str):
        team = [t.strip() for t in team.split(",") if t.strip()]
    return {
        "name": (data.get("name") or "").strip(),
        "platform": (data.get("platform") or "").strip(),
        "platformUrl": (data.get("platformUrl") or "").strip(),
        "registrationDeadline": normalise_date(data.get("registrationDeadline")),
        "submissionDeadline": normalise_date(data.get("submissionDeadline")),
        "prizePool": (data.get("prizePool") or "").strip(),
        "teamMembers": [str(t).strip() for t in team if str(t).strip()],
        "description": (data.get("description") or "").strip(),
    }


def call_gemini(image_bytes: bytes, mime_type: str) -> str:
    """Isolated so tests can replace it."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ExtractionError(
            "GEMINI_API_KEY is not set on the backend. Add it to backend/.env (or your host's env vars).",
            503,
        )
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    try:
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                PROMPT.format(today=datetime.now().strftime("%Y-%m-%d")),
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
    except Exception as e:  # network / quota / bad key / model not found
        raise ExtractionError(f"Gemini request failed: {e}", 502)
    return resp.text or ""


def extract_from_image(image_bytes: bytes, mime_type: Optional[str]) -> dict:
    raw = call_gemini(image_bytes, mime_type or "image/png")
    data = parse_model_json(raw)
    if isinstance(data, list) and data:
        data = data[0]
    return clean(data)
