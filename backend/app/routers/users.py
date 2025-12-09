from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from ..db import get_session
from ..models import User
from ..schemas import UserRead
from ..auth import get_current_user
from ..schemas import UserUpdate
from ..auth import get_password_hash
from ..schemas import UserCreate
from fastapi import Body

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_current_user(current=Depends(get_current_user)):
    return UserRead(id=current.id, username=current.username, full_name=current.full_name, role=current.role)


@router.put('/me', response_model=UserRead)
def update_current_user(payload: UserUpdate, session: Session = Depends(get_session), current=Depends(get_current_user)):
    # allow users to update their full name and password
    user = session.get(User, current.id)
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserRead(id=user.id, username=user.username, full_name=user.full_name, role=user.role)


@router.get("/", response_model=List[UserRead])
def list_users(session: Session = Depends(get_session), current=Depends(get_current_user)):
    # For demo, restrict to role 'admin'
    if current.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    statement = select(User)
    users = session.exec(statement).all()
    return [UserRead(id=u.id, username=u.username, full_name=u.full_name, role=u.role) for u in users]


@router.post('/', response_model=UserRead)
def create_user(payload: UserCreate, session: Session = Depends(get_session), current=Depends(get_current_user)):
    if current.role != 'admin':
        raise HTTPException(status_code=403, detail='Forbidden')
    # ensure username unique
    stmt = select(User).where(User.username == payload.username)
    if session.exec(stmt).first():
        raise HTTPException(status_code=400, detail='Username already exists')
    user = User(username=payload.username, full_name=payload.full_name or '', hashed_password=get_password_hash(payload.password), role=(payload.role or 'planner'))
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserRead(id=user.id, username=user.username, full_name=user.full_name, role=user.role)


@router.put('/{user_id}/role')
def change_user_role(user_id: int, role: str = Body(...), session: Session = Depends(get_session), current=Depends(get_current_user)):
    if current.role != 'admin':
        raise HTTPException(status_code=403, detail='Forbidden')
    u = session.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail='User not found')
    u.role = role
    session.add(u)
    session.commit()
    session.refresh(u)
    return {'ok': True}


@router.delete('/{user_id}')
def delete_user(user_id: int, session: Session = Depends(get_session), current=Depends(get_current_user)):
    if current.role != 'admin':
        raise HTTPException(status_code=403, detail='Forbidden')
    u = session.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail='User not found')
    session.delete(u)
    session.commit()
    return {'ok': True}
