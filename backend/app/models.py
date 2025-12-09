from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, nullable=False)
    full_name: Optional[str] = None
    hashed_password: str
    role: str = Field(default="planner")


class Machine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: Optional[str] = Field(default=None, index=True)
    status: str = Field(default="idle")
    last_heartbeat: Optional[datetime] = None


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_number: str = Field(index=True)
    product: str
    quantity: int
    priority: int = Field(default=1)
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ts: datetime = Field(default_factory=datetime.utcnow)
    source: str
    type: str
    payload: Optional[str] = None
