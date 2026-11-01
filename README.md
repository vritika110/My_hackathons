# ⚡ HackTracker — Personal Hackathon Management Dashboard

> A beautiful, dark-mode hackathon tracker built with Next.js 15 and Tailwind CSS 4.

![HackTracker Screenshot](public/og-preview.png)

[Live Website](https://myhackathons.vercel.app/)

## ✨ Features

- 🔐 **Google OAuth Authentication** — Locked exclusively to `vritika110@gmail.com`
- 🃏 **Dark Card Dashboard** — Registration deadline & team members are the most prominent info on each card
- ➕ **Manual Add Form** — Add hackathons with name, platform, deadlines, prizes, and team members
- 🤖 **AI Screenshot Extractor** — Powered by Gemini Vision API; upload a hackathon ad screenshot to auto-fill the form
- 🔔 **Automated Email Alerts** — Nodemailer sends alerts when registration deadlines are ≤3 days away
- 🔍 **Search & Sort** — Filter by name/platform/team, sort by deadline, prize, or name
- 📁 **JSON Data Store** — No external database required (local `data/hackathons.json`)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy and fill in `.env.local`:

```bash
# Already created for you — edit the values:
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Gemini API for AI Screenshot Extraction (https://aistudio.google.com/)
GEMINI_API_KEY=your-gemini-key

# Email Alerts (Gmail App Password)
SMTP_USER=vritika110@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=vritika110@gmail.com

# Demo mode (bypasses OAuth + email — set to false for production)
DEMO_MODE=true
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔑 Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **OAuth 2.0**
4. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
5. Paste Client ID & Secret into `.env.local`
6. Set `DEMO_MODE=false`

## 🤖 Setting Up AI Screenshot Extraction

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/)
2. Set `GEMINI_API_KEY=your-key` in `.env.local`
3. Upload a hackathon flyer screenshot → fields auto-fill!

## 🔔 Email Alert Cron Job

The `/api/alerts` endpoint can be triggered by any cron service:

- **Vercel Cron Jobs** (recommended for deployment) — add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/alerts",
    "schedule": "0 9 * * *"
  }]
}
```

- **Manual test**: Click "Test Alerts" in the dashboard header, or run:

```bash
npm run check-alerts
```

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, JSX) |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth.js v5 beta (Google OAuth) |
| AI OCR | Google Gemini Vision API |
| Email | Nodemailer (Gmail SMTP) |
| Storage | Local JSON file |
| Icons | Lucide React |

## 📁 Project Structure

```
hackathon-manager/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js   # Google OAuth
│   │   ├── hackathons/route.js           # CRUD API
│   │   ├── extract/route.js              # AI OCR
│   │   └── alerts/route.js              # Email alerts
│   ├── login/page.jsx                    # Login page
│   ├── unauthorized/page.jsx             # Access denied
│   ├── page.jsx                          # Dashboard
│   ├── providers.jsx                     # NextAuth provider
│   ├── layout.js                         # Root layout
│   └── globals.css                       # Design system
├── components/
│   ├── HackathonCard.jsx                 # Card component
│   ├── AddHackathonModal.jsx             # Add form modal
│   └── ScreenshotUploader.jsx            # AI extractor UI
├── data/
│   └── hackathons.json                   # Local data store
└── .env.local                            # API keys
```

## 🔗 GitHub Repository

[github.com/vritika110/My_hackathons](https://github.com/vritika110/My_hackathons)
