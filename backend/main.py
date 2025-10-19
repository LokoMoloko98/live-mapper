"""
Lightweight FastAPI backend for Cartrack vehicle tracking.
Acts as a proxy to avoid CORS issues and keep credentials secure.
"""
import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional

# Load environment variables
load_dotenv()

app = FastAPI(title="Live Mapper API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cartrack API configuration
CARTRACK_API_URL = os.getenv("CARTRACK_API_URL", "https://fleetapi-za.cartrack.com/rest")
VEHICLE_ID = os.getenv("CARTRACK_VEHICLE_ID", "CAA649529")
AUTH_TOKEN = os.getenv("CARTRACK_AUTH_TOKEN", "")

# Simple in-memory cache
_cache = {"data": None, "timestamp": None}
CACHE_DURATION = timedelta(seconds=10)  # Cache for 10 seconds


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Live Mapper API is running"}


@app.get("/api/vehicle/status")
async def get_vehicle_status():
    """
    Fetch current vehicle status from Cartrack API.
    Returns vehicle location, speed, ignition, etc.
    Uses 10-second cache to improve performance.
    """
    # Check cache
    if _cache["data"] and _cache["timestamp"]:
        age = datetime.now() - _cache["timestamp"]
        if age < CACHE_DURATION:
            return _cache["data"]
    
    url = f"{CARTRACK_API_URL}/vehicles/{VEHICLE_ID}/status"
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json",
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Update cache
            _cache["data"] = data
            _cache["timestamp"] = datetime.now()
            
            return data
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Cartrack API error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
