import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Hackathon(Base):
    __tablename__ = "hackathons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    platform: Mapped[str] = mapped_column(String(255), default="")
    platform_url: Mapped[str] = mapped_column(String(1000), default="")
    registration_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    submission_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    prize_pool: Mapped[str] = mapped_column(String(255), default="TBA")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(50), default="upcoming")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    team_members: Mapped[list["TeamMember"]] = relationship(
        back_populates="hackathon",
        cascade="all, delete-orphan",
        order_by="TeamMember.position",
        lazy="selectin",
    )

    def to_dict(self) -> dict:
        """Same JSON shape the React frontend already expects."""
        return {
            "id": self.id,
            "name": self.name,
            "platform": self.platform or "",
            "platformUrl": self.platform_url or "",
            "registrationDeadline": self.registration_deadline.isoformat() if self.registration_deadline else "",
            "submissionDeadline": self.submission_deadline.isoformat() if self.submission_deadline else "",
            "prizePool": self.prize_pool or "TBA",
            "teamMembers": [m.name for m in self.team_members],
            "description": self.description or "",
            "status": self.status or "upcoming",
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hackathon_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("hackathons.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer, default=0)

    hackathon: Mapped[Hackathon] = relationship(back_populates="team_members")
