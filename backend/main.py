import os
import random
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.auth
from vertexai.generative_models import GenerativeModel, Part
import vertexai

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="BOCRA Platform API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vertex AI Model Name
MODEL_ID = "gemini-1.5-flash-001" 

def init_vertex_ai():
    # If the user sets GOOGLE_APPLICATION_CREDENTIALS, this will automatically pick it up.
    # Also needs project id and location.
    project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    if project:
        vertexai.init(project=project, location=location)

try:
    init_vertex_ai()
except Exception as e:
    print(f"Warning: Failed to initialize Vertex AI: {e}")

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(chat: ChatMessage):
    try:
        model = GenerativeModel(MODEL_ID)
        prompt = f"""You are an AI assistant for the BOCRA (Botswana Communications Regulatory Authority) website.
Answer the user's question accurately and politely, based on regulatory guidelines in Botswana.
User Question: {chat.message}"""
        
        response = model.generate_content(prompt)
        return ChatResponse(reply=response.text)
    except Exception as e:
        # Fallback response for development without API keys
        print(f"Vertex AI Error: {e}")
        return ChatResponse(reply="Hello! I'm the BOCRA assistant. We are currently facing some technical issues connecting to Vertex AI. (Please provide Google Cloud API keys)")

class Complaint(BaseModel):
    id: Optional[str] = None
    category: str
    description: str
    contact: str
    status: Optional[str] = "Pending"

# Mock database for complaints
complaints_db = []

@app.post("/api/complaints")
async def create_complaint(complaint: Complaint):
    complaint.id = f"COM-{random.randint(1000, 9999)}"
    complaints_db.append(complaint)
    return {"message": "Complaint submitted successfully", "id": complaint.id, "status": complaint.status}

@app.get("/api/complaints/{complaint_id}")
async def get_complaint(complaint_id: str):
    for c in complaints_db:
        if c.id == complaint_id:
            return c
    raise HTTPException(status_code=404, detail="Complaint not found")

@app.get("/api/statistics")
async def get_statistics():
    return {
        "mobile_subscribers": {
            "Mascom": 1850000,
            "Orange": 1600000,
            "BTC": 850000
        },
        "internet_penetration": {
            "2022": 62,
            "2023": 68,
            "2024": 74,
            "2025": 79,
            "2026": 85
        },
        "complaints_resolved": 1245
    }

@app.get("/api/tariffs")
async def get_tariffs():
    return [
        {"operator": "Mascom", "plan": "MyZaka Data 1GB", "price": "P15.00", "validity": "1 Day"},
        {"operator": "Orange", "plan": "AllNet 1.5GB", "price": "P18.00", "validity": "1 Day"},
        {"operator": "BTC", "plan": "LiveWire 2GB", "price": "P20.00", "validity": "2 Days"}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
