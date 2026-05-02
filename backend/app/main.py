import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, async_session
from app.models import RawPost, Event, PkLocation  # noqa: F401 – ensure models registered
from app.routers import events, raw_posts, ingest
from app.schemas import HealthResponse
from app.seeds.location_seed import seed_locations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed locations
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    async with async_session() as db:
        count = await seed_locations(db)
        if count:
            logger.info("Seeded %d Pakistan reference locations on startup", count)

    yield

    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Pakistan Situation Monitor",
    description="Local situation awareness platform for Pakistan",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(raw_posts.router)
app.include_router(ingest.router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok")
