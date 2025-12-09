from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from ..db import get_session
from ..models import User
from ..schemas import Token, UserCreate, UserRead
from ..auth import get_password_hash, authenticate_user, create_access_token

router = APIRouter()


@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    # simple registration - no email checks for demo
    from sqlmodel import select

    statement = select(User).where(User.username == user_in.username)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    # Role handling: allow requesting a role, default to 'planner'
    role = getattr(user_in, 'role', None) or 'planner'
    # If attempting to register as admin, only allow when no other admin exists (bootstrap)
    if role == 'admin':
        stmt_admin = select(User).where(User.role == 'admin')
        any_admin = session.exec(stmt_admin).first()
        if any_admin:
            raise HTTPException(status_code=403, detail="Admin user already exists; cannot register admin")
    user = User(username=user_in.username, full_name=user_in.full_name or "", hashed_password=get_password_hash(user_in.password), role=role)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserRead(id=user.id, username=user.username, full_name=user.full_name, role=user.role)


@router.post("/token", response_model=Token)
async def login_for_access_token(request: Request, session: Session = Depends(get_session)):
    """Accept either form-encoded OAuth2PasswordRequestForm or JSON {username, password}.

    This makes the endpoint compatible with both OAuth2 clients and JSON requests from the frontend.
    """
    username = None
    password = None

    # Try to parse form data first (OAuth2PasswordRequestForm)
    try:
        form = await request.form()
        if "username" in form and "password" in form:
            username = form.get("username")
            password = form.get("password")
    except Exception:
        # ignore form parsing errors and try JSON next
        pass

    # If no form data, attempt JSON body
    if username is None or password is None:
        try:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
        except Exception:
            # Could not parse JSON
            pass

    if not username or not password:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Username and password required")

    user = authenticate_user(session, username, password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
