# HackTracker backend (Python + SQL)

FastAPI + SQLAlchemy. Stores hackathons in a real SQL database, runs the Gemini
screenshot extraction, and sends deadline e-mails.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in GEMINI_API_KEY, SMTP_PASS ...
python migrate_json.py ../data/hackathons.json         # optional: import old data
uvicorn app.main:app --reload --port 8000
```
Then start the website as usual (`npm run dev`) with `BACKEND_URL=http://127.0.0.1:8000`
in `.env.local`. Data is kept in `backend/hackathons.db`.

Run the tests: `python -m pytest -q`

## Deploy (the website is on Vercel, so the backend must live somewhere that keeps data)

1. Create a free Postgres (Neon / Supabase / Render) and copy its connection string.
2. Deploy `backend/` to Render / Railway / Fly (start command:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`) with the env vars from `.env.example`
   (`DATABASE_URL`, `BACKEND_API_KEY`, `GEMINI_API_KEY`, `SMTP_*`, `ALERT_EMAIL`).
3. In Vercel -> Project -> Environment Variables add:
   `BACKEND_URL` (your backend URL), `BACKEND_API_KEY` (same value), `CRON_SECRET` (any random string).
4. Redeploy. The daily 09:00 UTC cron in `vercel.json` then calls `/api/alerts`.

## Gmail
Use an **App Password** (Google Account -> Security -> 2-Step Verification -> App passwords),
not your normal password. Click **Send Test Email** on the dashboard to verify.
