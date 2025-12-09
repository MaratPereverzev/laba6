from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from ..db import get_session
from ..models import Machine
from ..schemas import MachineCreate, MachineRead
from ..auth import get_current_user

router = APIRouter()


@router.post("/", response_model=MachineRead)
def create_machine(m: MachineCreate, session: Session = Depends(get_session), user=Depends(get_current_user)):
    obj = Machine(name=m.name, code=m.code)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


@router.get("/", response_model=List[MachineRead])
def list_machines(session: Session = Depends(get_session), user=Depends(get_current_user)):
    statement = select(Machine)
    machines = session.exec(statement).all()
    return machines


@router.get("/{machine_id}", response_model=MachineRead)
def get_machine(machine_id: int, session: Session = Depends(get_session), user=Depends(get_current_user)):
    m = session.get(Machine, machine_id)
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    return m


@router.put("/{machine_id}", response_model=MachineRead)
def update_machine(machine_id: int, payload: MachineCreate, session: Session = Depends(get_session), user=Depends(get_current_user)):
    m = session.get(Machine, machine_id)
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    # Only admin or planner can update machines
    if user.role not in ("admin", "planner"):
        raise HTTPException(status_code=403, detail="Forbidden")
    m.name = payload.name
    m.code = payload.code
    session.add(m)
    session.commit()
    session.refresh(m)
    return m


@router.delete("/{machine_id}")
def delete_machine(machine_id: int, session: Session = Depends(get_session), user=Depends(get_current_user)):
    m = session.get(Machine, machine_id)
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    # Only admin can delete machines
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    session.delete(m)
    session.commit()
    return {"ok": True}
