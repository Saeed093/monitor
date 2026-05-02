import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

from app.database import Base


class RawPost(Base):
    __tablename__ = "raw_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(Text, nullable=False)
    source_type = Column(Text, nullable=False)
    source_post_id = Column(Text, nullable=True)
    author_name = Column(Text, nullable=True)
    author_handle = Column(Text, nullable=True)
    text = Column(Text, nullable=False)
    media_urls = Column(ARRAY(Text), nullable=True)
    post_url = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, server_default=func.now())
    raw_json = Column(JSONB, nullable=True)


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    country = Column(Text, default="Pakistan")
    province = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    city = Column(Text, nullable=True)
    location_text = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    severity = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(Text, default="developing")
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    source_count = Column(Integer, default=1)
    sources = Column(JSONB, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PkLocation(Base):
    __tablename__ = "pk_locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    alternate_names = Column(ARRAY(Text), nullable=True)
    type = Column(Text, nullable=True)
    city = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    province = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
