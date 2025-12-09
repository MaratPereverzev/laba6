from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from ..db import get_session
from ..models import Order
from ..schemas import OrderCreate, OrderRead
from ..auth import get_current_user

router = APIRouter()


@router.post("/", response_model=OrderRead)
def create_order(payload: OrderCreate, session: Session = Depends(get_session), user=Depends(get_current_user)):
    # Allow status to be set on creation; enforce role
    if user.role not in ("admin", "planner"):
        raise HTTPException(status_code=403, detail="Forbidden")
    obj = Order(order_number=payload.order_number, product=payload.product, quantity=payload.quantity, priority=payload.priority, status=(payload.status or 'pending'))
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


@router.get("/", response_model=List[OrderRead])
def list_orders(session: Session = Depends(get_session), user=Depends(get_current_user)):
    statement = select(Order)
    return session.exec(statement).all()


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, session: Session = Depends(get_session), user=Depends(get_current_user)):
    o = session.get(Order, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o


@router.put("/{order_id}", response_model=OrderRead)
def update_order(order_id: int, payload: OrderCreate, session: Session = Depends(get_session), user=Depends(get_current_user)):
    o = session.get(Order, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    # Only admin or planner can update orders
    if user.role not in ("admin", "planner"):
        raise HTTPException(status_code=403, detail="Forbidden")
    o.order_number = payload.order_number
    o.product = payload.product
    o.quantity = payload.quantity
    o.priority = payload.priority
    # allow status update
    if getattr(payload, 'status', None) is not None:
        o.status = payload.status
    session.add(o)
    session.commit()
    session.refresh(o)
    return o


@router.delete("/{order_id}")
def delete_order(order_id: int, session: Session = Depends(get_session), user=Depends(get_current_user)):
    o = session.get(Order, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    # Only admin can delete orders
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    session.delete(o)
    session.commit()
    return {"ok": True}
