"""One-off: copy hackathons from the old data/hackathons.json into the SQL database.

    python migrate_json.py ../data/hackathons.json

Safe to run more than once (rows whose id already exists are skipped).
"""
import json
import sys
from datetime import datetime

from app.database import Base, SessionLocal, engine
from app.models import Hackathon, TeamMember
from app.schemas import HackathonCreate


def main(path: str):
    Base.metadata.create_all(engine)
    with open(path, encoding="utf-8") as f:
        rows = json.load(f)
    added = skipped = 0
    with SessionLocal() as db:
        for r in rows:
            if db.get(Hackathon, r.get("id")):
                skipped += 1
                continue
            p = HackathonCreate(**r)
            created = None
            if r.get("createdAt"):
                created = datetime.fromisoformat(r["createdAt"].replace("Z", "+00:00")).replace(tzinfo=None)
            h = Hackathon(
                id=r.get("id") or None, name=p.name, platform=p.platform, platform_url=p.platformUrl,
                registration_deadline=p.registrationDeadline, submission_deadline=p.submissionDeadline,
                prize_pool=p.prizePool, description=p.description, status=r.get("status", "upcoming"),
            )
            if created:
                h.created_at = created
            h.team_members = [TeamMember(name=n, position=i) for i, n in enumerate(p.teamMembers or [])]
            db.add(h)
            added += 1
        db.commit()
    print(f"Imported {added}, skipped {skipped} already present.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "../data/hackathons.json")
