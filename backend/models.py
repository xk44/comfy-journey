"""SQLAlchemy models for relational workflow and action storage."""

import os
import uuid
from sqlalchemy import create_engine, Column, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./comfy.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Workflow(Base):
    """Workflow stored in a relational database."""

    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, default="")
    data = Column(Text)

    actions = relationship(
        "Action", back_populates="workflow", cascade="all, delete-orphan"
    )


class Action(Base):
    """User defined action mapped to a workflow."""

    __tablename__ = "actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    button = Column(String, nullable=False)
    name = Column(String, nullable=False)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    parameters = Column(Text)

    workflow = relationship("Workflow", back_populates="actions")


class Prompt(Base):
    """Record of a submitted prompt"""

    __tablename__ = "prompts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    text = Column(Text, nullable=False)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    workflow = relationship("Workflow")
    outputs = relationship(
        "ImageOutput", back_populates="prompt", cascade="all, delete-orphan"
    )


class ImageOutput(Base):
    """Image generated from a prompt"""

    __tablename__ = "image_outputs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    prompt = relationship("Prompt", back_populates="outputs")


def init_db() -> None:
    """Create all tables for the configured engine."""
    Base.metadata.create_all(bind=engine)
