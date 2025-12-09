from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from .db import engine
from .routers import auth, machines, orders, users, events, reports

app = FastAPI(title="Production Optimization API")

# Allow frontend origin; adjust in production to restrict origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(machines.router, prefix="/machines", tags=["machines"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])


@app.on_event("startup")
def on_startup():
    # create tables (for demo). For production use Alembic migrations.
    SQLModel.metadata.create_all(engine)


@app.get("/")
def read_root():
    return {"status": "ok", "service": "production-optimization-backend"}
