-- Reference schema (works on SQLite and PostgreSQL).
-- The app creates these tables automatically on startup via SQLAlchemy,
-- so you only need this file if you want to create them by hand.

CREATE TABLE IF NOT EXISTS hackathons (
    id                    VARCHAR(36)  PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL,
    platform              VARCHAR(255) NOT NULL DEFAULT '',
    platform_url          VARCHAR(1000) NOT NULL DEFAULT '',
    registration_deadline DATE,
    submission_deadline   DATE,
    prize_pool            VARCHAR(255) NOT NULL DEFAULT 'TBA',
    description           TEXT         NOT NULL DEFAULT '',
    status                VARCHAR(50)  NOT NULL DEFAULT 'upcoming',
    created_at            TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    id            INTEGER PRIMARY KEY,          -- SERIAL on Postgres (SQLAlchemy handles it)
    hackathon_id  VARCHAR(36) NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    position      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_hackathons_reg ON hackathons (registration_deadline);
CREATE INDEX IF NOT EXISTS ix_team_hackathon ON team_members (hackathon_id);
