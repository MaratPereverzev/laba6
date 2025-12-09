from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = 'planner'


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None


class UserRead(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    role: str


class MachineCreate(BaseModel):
    name: str
    code: Optional[str] = None


class MachineRead(BaseModel):
    id: int
    name: str
    code: Optional[str]
    status: str


class OrderCreate(BaseModel):
    order_number: str
    product: str
    quantity: int
    priority: Optional[int] = 1
    status: Optional[str] = 'pending'


class OrderRead(BaseModel):
    id: int
    order_number: str
    product: str
    quantity: int
    priority: int
    status: str


class EventCreate(BaseModel):
    source: str
    type: str
    payload: dict
    ts: Optional[str] = None


class EventRead(BaseModel):
    id: int
    ts: str
    source: str
    type: str
    payload: Optional[dict]


class OEEReport(BaseModel):
    machine_id: str
    start: str
    end: str
    planned_seconds: float
    downtime_seconds: float
    run_seconds: float
    availability: float
    performance: float
    quality: float
    oee: float
