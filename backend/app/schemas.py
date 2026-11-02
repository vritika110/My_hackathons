from datetime import date
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict, field_validator


def _to_date(v) -> Optional[date]:
    if v in (None, ""):
        return None
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        raise ValueError("dates must be YYYY-MM-DD")


def _to_members(v) -> List[str]:
    if v is None:
        return []
    if isinstance(v, str):
        v = v.split(",")
    seen, out = set(), []
    for m in v:
        m = str(m).strip()
        if m and m not in seen:
            seen.add(m)
            out.append(m)
    return out


class HackathonCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = "Untitled Hackathon"
    platform: str = ""
    platformUrl: str = ""
    registrationDeadline: Optional[date] = None
    submissionDeadline: Optional[date] = None
    prizePool: str = "TBA"
    teamMembers: Union[List[str], str, None] = None
    description: str = ""

    @field_validator("registrationDeadline", "submissionDeadline", mode="before")
    @classmethod
    def _dates(cls, v):
        return _to_date(v)

    @field_validator("name", mode="before")
    @classmethod
    def _name(cls, v):
        v = (v or "").strip() if isinstance(v, str) or v is None else str(v)
        return v or "Untitled Hackathon"

    @field_validator("prizePool", mode="before")
    @classmethod
    def _prize(cls, v):
        return (v or "").strip() or "TBA" if isinstance(v, (str, type(None))) else str(v)

    @field_validator("teamMembers", mode="before")
    @classmethod
    def _team(cls, v):
        return _to_members(v)


class HackathonUpdate(BaseModel):
    """Every field optional -> partial update."""
    model_config = ConfigDict(extra="ignore")

    id: Optional[str] = None
    name: Optional[str] = None
    platform: Optional[str] = None
    platformUrl: Optional[str] = None
    registrationDeadline: Optional[date] = None
    submissionDeadline: Optional[date] = None
    prizePool: Optional[str] = None
    teamMembers: Union[List[str], str, None] = None
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("registrationDeadline", "submissionDeadline", mode="before")
    @classmethod
    def _dates(cls, v):
        return _to_date(v)

    @field_validator("teamMembers", mode="before")
    @classmethod
    def _team(cls, v):
        return None if v is None else _to_members(v)
