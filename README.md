# Pakistan Situation Monitor

A local-first situation awareness platform for monitoring public events across Pakistan. The system collects text-based signals, processes them through a local AI model (Ollama), extracts structured events, and displays them on an interactive dark-themed map dashboard.

## Features

- **Interactive Map Dashboard** -- Dark-themed Leaflet map centered on Pakistan with color-coded event markers
- **AI Event Extraction** -- Local Ollama (qwen3:8b) processes raw text in English, Urdu, and Roman Urdu
- **Event Classification** -- Protests, road blocks, floods, fires, security incidents, power outages, and more
- **Location Resolution** -- Fuzzy matching against 30 seeded Pakistani locations
- **Confidence Scoring** -- Multi-factor confidence with source type, location, and URL adjustments
- **Duplicate Merging** -- Similar events within 6 hours are merged automatically
- **Manual Signal Input** -- Add raw posts through the UI for immediate AI processing
- **Filtering** -- By event type, province, severity, confidence, and time range

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | Next.js 15, TailwindCSS, Leaflet, Shadcn UI  |
| Backend  | FastAPI, SQLAlchemy (async), Pydantic v2      |
| Database | PostgreSQL 16                                 |
| AI       | Ollama (local) with qwen3:8b                  |

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 16** (local install or Docker)
- **Ollama** (https://ollama.com)

## Quick Start

### 1. Clone and navigate

```bash
cd pakistan-situation-monitor
```

### 2. Set up PostgreSQL

**Option A: Docker (recommended)**

```bash
docker compose up db -d
```

**Option B: Local PostgreSQL**

```sql
CREATE DATABASE pak_monitor;
```

### 3. Install and run Ollama

```bash
# Install Ollama from https://ollama.com
ollama pull qwen3:8b
ollama serve
```

Ollama should be running at `http://localhost:11434`.

### 4. Set up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file (edit if needed)
copy .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 5. Set up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

On first backend startup, **Pakistan reference locations** (for geocoding) are seeded if the `pk_locations` table is empty. Add real signals via **Add Signal**, **Ingest Feeds** (X/Facebook when configured), or `POST /api/raw-posts/process`.

## API Endpoints

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/health`                 | Health check                         |
| GET    | `/api/events`             | List events (with query filters)     |
| GET    | `/api/events/{id}`        | Get single event                     |
| POST   | `/api/raw-posts/process`  | Submit and process a raw post        |
| GET    | `/api/raw-posts`          | List all raw posts                   |
| POST   | `/api/ingest/all`         | Ingest from X / Facebook (see `.env`) |

### Example: Submit a signal

```bash
curl -X POST http://localhost:8000/api/raw-posts/process \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "source_type": "Manual",
    "text": "Faizabad pr road block hai due to protest"
  }'
```

### Example: Query events

```bash
# All events
curl http://localhost:8000/api/events

# Filtered
curl "http://localhost:8000/api/events?event_type=protest&province=Islamabad+Capital+Territory&time_range=24h"
```

## Docker Compose (Full Stack)

To run everything in Docker:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432

Note: Ollama runs on the host machine. The backend connects to it via `host.docker.internal`.

## Event Types

| Type                | Description              |
|---------------------|--------------------------|
| protest             | Public protest            |
| road_block          | Road blockage             |
| traffic_disruption  | Traffic incident          |
| fire                | Fire incident             |
| flood               | Flooding                  |
| rain                | Heavy rain / waterlogging |
| power_outage        | Electricity outage        |
| security_incident   | Security-related event    |
| political_rally     | Political gathering       |
| earthquake          | Earthquake                |
| natural_disaster    | Other natural disaster    |
| economic_alert      | Economic disruption       |
| general_alert       | General alert             |

## Project Structure

```
pakistan-situation-monitor/
  backend/
    app/
      main.py                          # FastAPI app entry point
      database.py                      # Async SQLAlchemy setup
      models.py                        # ORM models
      schemas.py                       # Pydantic schemas
      config.py                        # Settings
      services/
        ai_event_extractor.py          # Ollama AI integration
        location_resolver.py           # Location fuzzy matching
        confidence.py                  # Confidence scoring
        event_merger.py                # Duplicate detection
      routers/
        events.py                      # Event endpoints
        raw_posts.py                   # Raw post endpoints
        ingest.py                      # X / Facebook ingest
      seeds/
        pk_locations.py                # Reference locations for geocoding
        location_seed.py               # One-time location table seed
    requirements.txt
  frontend/
    src/
      app/page.tsx                     # Main dashboard
      components/
        map/PakistanMap.tsx            # Leaflet map
        map/EventMarker.tsx            # Map markers
        sidebar/FilterSidebar.tsx      # Filter panel
        events/EventCard.tsx           # Event list cards
        events/EventDetail.tsx         # Event detail drawer
        signals/AddSignalModal.tsx     # Add signal form
      lib/
        api.ts                         # Backend API client
        types.ts                       # TypeScript types
        constants.ts                   # Colors, labels, config
      hooks/
        useEvents.ts                   # Event polling hook
  docker-compose.yml
  README.md
```
