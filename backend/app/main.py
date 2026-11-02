import os
import secrets
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import alerts, extract
from .database import Base, engine, get_db
from .models import Hackathon, TeamMember
from .schemas import HackathonCreate, HackathonUpdate

load_dotenv()
MAX_IMAGE_BYTES = 10 * 1024 * 1024


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)  # creates tables on first start
    yield


app = FastAPI(title="HackTracker API", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if origins:
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])


def require_key(x_api_key: Optional[str] = Header(default=None)):
    expected = os.getenv("BACKEND_API_KEY")
    if not expected:  # no key configured -> open (fine for local dev only)
        return
    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(401, "Invalid or missing API key")


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"ok": True, "database": engine.dialect.name}


def _set_members(h: Hackathon, names):
    h.team_members = [TeamMember(name=n, position=i) for i, n in enumerate(names)]


@app.get("/api/hackathons", dependencies=[Depends(require_key)])
def list_hackathons(db: Session = Depends(get_db)):
    rows = db.scalars(select(Hackathon).order_by(Hackathon.created_at.desc())).all()
    return [h.to_dict() for h in rows]


@app.post("/api/hackathons", status_code=201, dependencies=[Depends(require_key)])
def create_hackathon(body: HackathonCreate, db: Session = Depends(get_db)):
    h = Hackathon(
        name=body.name,
        platform=body.platform,
        platform_url=body.platformUrl,
        registration_deadline=body.registrationDeadline,
        submission_deadline=body.submissionDeadline,
        prize_pool=body.prizePool,
        description=body.description,
    )
    _set_members(h, body.teamMembers or [])
    db.add(h)
    db.commit()
    return h.to_dict()


def _apply_update(h: Hackathon, body: HackathonUpdate, db: Session):
    fields = body.model_fields_set
    mapping = {"name": "name", "platform": "platform", "platformUrl": "platform_url",
               "registrationDeadline": "registration_deadline", "submissionDeadline": "submission_deadline",
               "prizePool": "prize_pool", "description": "description", "status": "status"}
    for api_name, col in mapping.items():
        if api_name in fields:
            setattr(h, col, getattr(body, api_name))
    if "teamMembers" in fields and body.teamMembers is not None:
        _set_members(h, body.teamMembers)
    db.commit()
    return h.to_dict()


@app.put("/api/hackathons", dependencies=[Depends(require_key)])
def update_by_body_id(body: HackathonUpdate, db: Session = Depends(get_db)):
    """Same contract as the old Next.js route: id lives in the body."""
    h = db.get(Hackathon, body.id) if body.id else None
    if not h:
        raise HTTPException(404, "Not found")
    return _apply_update(h, body, db)


@app.put("/api/hackathons/{hid}", dependencies=[Depends(require_key)])
@app.patch("/api/hackathons/{hid}", dependencies=[Depends(require_key)])
def update_hackathon(hid: str, body: HackathonUpdate, db: Session = Depends(get_db)):
    h = db.get(Hackathon, hid)
    if not h:
        raise HTTPException(404, "Not found")
    return _apply_update(h, body, db)


@app.delete("/api/hackathons", dependencies=[Depends(require_key)])
def delete_hackathon(id: str = Query(...), db: Session = Depends(get_db)):
    h = db.get(Hackathon, id)
    if not h:
        raise HTTPException(404, "Not found")
    db.delete(h)
    db.commit()
    return {"success": True}


@app.post("/api/extract", dependencies=[Depends(require_key)])
async def extract_screenshot(image: UploadFile = File(...)):
    data = await image.read()
    if not data:
        raise HTTPException(400, "Empty file")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Image is larger than 10 MB")
    try:
        extracted = extract.extract_from_image(data, image.content_type)
    except extract.ExtractionError as e:
        raise HTTPException(e.status, str(e))
    return {"extracted": extracted, "demo": False}


@app.api_route("/api/alerts", methods=["GET", "POST"], dependencies=[Depends(require_key)])
def run_alerts(test: bool = False, db: Session = Depends(get_db)):
    try:
        return alerts.run_check(db, send_test=test)
    except alerts.AlertError as e:
        return JSONResponse({"error": str(e), "message": str(e), "sent": False}, status_code=e.status)
