# BOCRA Digital Platform

> **BOCRA Youth Hackathon 2026** — A modern, secure, and accessible digital platform for the Botswana Communications Regulatory Authority.

## Live Deployments

| Service  | URL                                      |
| -------- | ---------------------------------------- |
| Frontend | https://bocra-six.vercel.app             |
| Backend  | https://bocra-pb4b.onrender.com          |
| API Docs | https://bocra-pb4b.onrender.com/docs     |

---

## Overview

BOCRA (Botswana Communications Regulatory Authority) is mandated to regulate telecommunications, broadcasting, postal, and internet services in Botswana. This platform modernises BOCRA's digital presence by providing:

- **Public services** — license verification, type approval applications, complaint submission & tracking, domain registration, and public consultations
- **Role-based dashboard** — complaints management, licensing workflows, billing & payments, cyber-incident reporting, QoS monitoring, and certificate management
- **AI-powered assistant** — a Gemini-powered chatbot for both public visitors and internal officers
- **Real-time analytics** — dashboard statistics, notification centre, and audit logging

---

## Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Frontend  | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Redux Toolkit, Recharts, Leaflet |
| Backend   | FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn                             |
| Database  | Supabase (PostgreSQL) — SQLite fallback for local dev                      |
| AI        | Google Gemini 2.5 Flash                                                    |
| Storage   | Cloudinary (primary), Supabase Storage (fallback)                          |
| Auth      | Supabase Auth + local session management                                   |
| Hosting   | Vercel (frontend), Render (backend)                                        |

---

## Project Structure

```
bocra-hackathon/
├── frontend/               # Next.js 16 app (App Router)
│   ├── src/
│   │   ├── app/            # Pages & routes (40+ routes)
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # Utilities, API clients, store
│   │   └── ...
│   ├── public/             # Static assets
│   └── package.json
├── backend/                # FastAPI service
│   ├── app/
│   │   ├── controllers/    # API route handlers (15+ routers)
│   │   ├── models/         # SQLAlchemy ORM models (38+ entities)
│   │   ├── services/       # Business logic layer
│   │   ├── repositories/   # Data access layer
│   │   ├── integrations/   # External service clients
│   │   └── config.py       # App configuration
│   ├── main.py             # Entry point
│   └── requirements.txt
└── docs/                   # Schema & architecture docs
```

---

## Prerequisites

- **Node.js** >= 18 (recommended: 20+)
- **Python** >= 3.10
- **Git**

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/bocra-hackathon.git
cd bocra-hackathon
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Run the server
python main.py
```

The API will be available at **http://localhost:8000**.
Interactive API docs (Swagger) at **http://localhost:8000/docs**.

> By default the backend uses **SQLite** (`bocra_dev.db`) so you can run it without setting up PostgreSQL. Set `SEED_DEMO_DATA=true` in `.env` to auto-populate sample data on first run.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# Run the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### 4. Open in your browser

Visit `http://localhost:3000` — the frontend will communicate with the backend at `http://localhost:8000`.

### Demo sign-in

Use the seeded demo accounts for walkthroughs and judging:

- `admin@bocra.demo` / `bocra2026`
- `officer@bocra.demo` / `bocra2026`
- `approver@bocra.demo` / `bocra2026`
- `applicant@bocra.demo` / `bocra2026`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                  | Description                          | Default / Example                        |
| ------------------------- | ------------------------------------ | ---------------------------------------- |
| `APP_ENV`                 | Environment mode                     | `development`                            |
| `DEBUG`                   | Enable debug logging                 | `false`                                  |
| `DATABASE_URL`            | Database connection string           | `sqlite:///./bocra_dev.db`               |
| `SEED_DEMO_DATA`          | Seed sample data on startup          | `false`                                  |
| `LOCAL_AUTH_SALT`          | Salt for session encryption          | *(set a long random string)*             |
| `SESSION_TTL_HOURS`       | Session duration                     | `24`                                     |
| `ALLOW_DEMO_AUTH`         | Keep seeded demo accounts enabled    | `true`                                   |
| `ALLOWED_ORIGINS`         | CORS origins (comma-separated)       | `http://localhost:3000`                  |
| `GOOGLE_API_KEY`          | Google Gemini API key                | *(required for AI features)*             |
| `GOOGLE_AI_MODEL`         | AI model name                        | `gemini-2.5-flash`                       |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name                | *(required for file uploads)*            |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                   |                                          |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                |                                          |
| `SUPABASE_URL`            | Supabase project URL                 | `https://<ref>.supabase.co`              |
| `SUPABASE_ANON_KEY`       | Supabase anonymous key               |                                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key          |                                          |

### Frontend (`frontend/.env.local`)

| Variable         | Description              | Default / Example    |
| ---------------- | ------------------------ | -------------------- |
| `GEMINI_API_KEY`  | Google Gemini API key    | *(required for AI)*  |
| `GEMINI_MODEL`    | Gemini model to use      | `gemini-2.5-flash`   |

---

## Key Features

### Public Portal
- Organisation info, mandate, legislation, and career listings
- License verification and type-approval application
- Complaint submission with real-time status tracking
- Public consultations, tenders, media, and document library
- AI-powered public chatbot for FAQs and guidance

### Dashboard (Role-Based)
- **Complaints** — submit, review, assign, resolve, and track complaints
- **Licensing** — apply for and manage license records
- **Type Approval** — device certification workflow with officer actions
- **Billing & Payments** — invoice generation, payment tracking, receipts
- **Cybersecurity (CIRT)** — cyber-incident reporting and tracking
- **Quality of Service** — QoS metrics and data visualisation
- **Certificates & Documents** — certificate issuance and document management
- **Notifications** — real-time in-app notification centre
- **AI Agent** — Gemini-powered assistant with tool-calling capabilities
- **Admin** — user management, roles, permissions, and audit logs

---

## API Documentation

Once the backend is running, visit **http://localhost:8000/docs** for the full interactive Swagger UI, or the live version at **https://bocra-pb4b.onrender.com/docs**.

---

## Scripts Reference

### Frontend

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start development server   |
| `npm run build`   | Build for production       |
| `npm start`       | Start production server    |
| `npm run lint`    | Run ESLint                 |

### Backend

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `python main.py`   | Start the FastAPI server (port 8000)|
| `pytest`           | Run test suite                      |

---

## Team

**AfroNative Solutions** — BOCRA Youth Hackathon 2026

---

## License

This project was built for the BOCRA Website Development Hackathon (March 2026).
