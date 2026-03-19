# BOCRA Modern Regulatory Platform (Hackathon Edition) 🇧🇼

This is a full-stack modernization of the BOCRA website, featuring a Next.js frontend, a FastAPI backend, and Google Vertex AI integration.

## 🚀 Quick Start (Running the Project)

### 1. The Backend (FastAPI)
The backend handles AI chat, statistics, and complaints.

```bash
cd backend
# Create virtual environment (if not done)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi "uvicorn[standard]" google-cloud-aiplatform python-dotenv pydantic

# Run the server
python main.py
```
*The API will be available at: http://localhost:8000*
*Interactive Docs (Swagger): http://localhost:8000/docs*

### 2. The Frontend (Next.js)
The frontend is a modern, responsive dashboard built with Tailwind CSS and Framer Motion.

```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm run dev
```
*The UI will be available at: http://localhost:3000*

---

## 🏗️ Project Structure

- **`/frontend`**: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **`/backend`**: Python FastAPI, Pydantic, Vertex AI SDK.
- **`/BOCRA_Website_Audit_Report.pdf`**: The original audit report reference.

## 🤖 Vertex AI Configuration
To enable the AI Assistant, create a `.env` file in the `/backend` directory:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json
```

## ✨ Key Features Implemented
- **Dynamic Hero Section**: Modern, high-impact landing with instant search.
- **Live Stats Dashboard**: Real-time charts for mobile market share and internet growth.
- **Smart AI Chatbot**: Powered by Google Vertex AI (Gemini Flash).
- **Responsive Navbar/Footer**: Replaces the outdated multi-row navigation from the audit.
- **Dark Mode Support**: Context-aware styling throughout the app.
