# BOCRA Backend API (Hackathon Branch)

This branch contains the BOCRA backend API built with FastAPI, Pydantic, and Google Vertex AI integration.

## Branch Purpose

This is the backend-only branch of the project.
For the combined full-stack version, use the `main` branch.
For the UI-only version, use the `codex/frontend` branch.

## Quick Start

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi "uvicorn[standard]" google-cloud-aiplatform python-dotenv pydantic
python main.py
```

The API will be available at `http://localhost:8000`.
Swagger docs will be available at `http://localhost:8000/docs`.

## Environment Variables

Create a `.env` file in `backend/` with:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json
```

## Included In This Branch

- `backend/`: FastAPI service
- `BOCRA_Website_Audit_Report.pdf`: audit reference
- `bocra_website_audit_report.md`: audit notes

## API Features

- AI chat endpoint powered by Vertex AI
- Complaint submission and tracking endpoints
- Statistics endpoint
- Tariff data endpoint
- CORS enabled for frontend integration
