from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session
import json
from datetime import datetime

from ..db import get_session
from ..schemas import EventCreate, EventRead
from ..models import Event
from ..auth import get_current_user

router = APIRouter()


@router.post("/bulk", response_model=List[EventRead])
def ingest_events(events: List[EventCreate], session: Session = Depends(get_session), user=Depends(get_current_user)):
    objs = []
    for ev in events:
        # Validate basic shape
        if not ev.type or not ev.source:
            raise HTTPException(status_code=400, detail="Event must have source and type")
        # allow optional timestamp (ISO) for seeding historical events
        obj_kwargs = { 'source': ev.source, 'type': ev.type, 'payload': json.dumps(ev.payload) }
        if getattr(ev, 'ts', None):
            try:
                obj_kwargs['ts'] = datetime.fromisoformat(ev.ts)
            except Exception:
                # ignore parse errors and let default ts apply
                pass
        obj = Event(**obj_kwargs)
        session.add(obj)
        objs.append(obj)
    session.commit()
    for o in objs:
        session.refresh(o)
    # map to read schema
    result = []
    for o in objs:
        try:
            payload = json.loads(o.payload) if o.payload else None
        except Exception:
            payload = None
        result.append(EventRead(id=o.id, ts=o.ts.isoformat(), source=o.source, type=o.type, payload=payload))
    return result
