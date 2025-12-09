from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timedelta, timezone
import json

from ..db import get_session
from ..models import Event, Order
from ..schemas import OEEReport
from ..auth import get_current_user

router = APIRouter()


@router.get("/oee", response_model=OEEReport)
def compute_oee(
    machine_id: str = Query(..., description="machine id or code used as Event.source"),
    start: str = Query(..., description="start ISO datetime"),
    end: str = Query(..., description="end ISO datetime"),
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    try:
        dt_start = datetime.fromisoformat(start)
        dt_end = datetime.fromisoformat(end)
        # normalize to UTC-aware datetimes for safe comparisons
        def to_utc_aware(d: datetime) -> datetime:
            if d is None:
                return d
            if d.tzinfo is None:
                return d.replace(tzinfo=timezone.utc)
            return d.astimezone(timezone.utc)
        dt_start = to_utc_aware(dt_start)
        dt_end = to_utc_aware(dt_end)
    except Exception:
        raise HTTPException(status_code=400, detail="start/end must be ISO datetimes")
    if dt_end <= dt_start:
        raise HTTPException(status_code=400, detail="end must be after start")

    planned_seconds = (dt_end - dt_start).total_seconds()

    statement = select(Event).where(Event.source == machine_id)
    events = session.exec(statement).all()

    # filter by timestamp
    # filter by timestamp (normalize event ts to UTC-aware for comparison)
    def event_ts_aware(e):
        ets = e.ts
        if ets is None:
            return None
        if ets.tzinfo is None:
            return ets.replace(tzinfo=timezone.utc)
        return ets.astimezone(timezone.utc)

    filtered = [e for e in events if (event_ts_aware(e) is not None) and (dt_start <= event_ts_aware(e) <= dt_end)]

    downtime_seconds = 0.0
    total_produced = 0
    total_good = 0
    ideal_cycle_seconds_acc = 0.0
    ideal_cycle_counts = 0

    for e in filtered:
        payload = None
        try:
            payload = json.loads(e.payload) if e.payload else None
        except Exception:
            payload = None
        if e.type == 'downtime' and payload:
            # expect payload: {"duration_seconds": 30}
            downtime_seconds += float(payload.get('duration_seconds', 0))
        if e.type == 'production' and payload:
            produced = int(payload.get('produced', 0))
            good = int(payload.get('good', 0))
            ict_ms = payload.get('ideal_cycle_time_ms')
            total_produced += produced
            total_good += good
            if ict_ms:
                ideal_cycle_seconds_acc += float(ict_ms) / 1000.0
                ideal_cycle_counts += 1

    run_seconds = max(0.0, planned_seconds - downtime_seconds)
    availability = run_seconds / planned_seconds if planned_seconds > 0 else 0.0

    if total_produced > 0 and run_seconds > 0:
        # average ideal cycle time
        avg_ict = (ideal_cycle_seconds_acc / ideal_cycle_counts) if ideal_cycle_counts > 0 else 0.0
        if avg_ict > 0:
            performance = (total_produced * avg_ict) / run_seconds
        else:
            performance = 1.0
    else:
        performance = 0.0

    quality = (total_good / total_produced) if total_produced > 0 else 0.0

    oee = availability * performance * quality

    return OEEReport(
        machine_id=machine_id,
        start=dt_start.isoformat(),
        end=dt_end.isoformat(),
        planned_seconds=planned_seconds,
        downtime_seconds=downtime_seconds,
        run_seconds=run_seconds,
        availability=availability,
        performance=performance,
        quality=quality,
        oee=oee,
    )


@router.get('/production_trend')
def production_trend(hours: Optional[int] = 12, session: Session = Depends(get_session), user=Depends(get_current_user)):
    """Return hourly production totals for the last `hours` hours.

    Response: list of { hour: ISOhour, produced: int, good: int }
    """
    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=hours)
    statement = select(Event).where(Event.type == 'production')
    events = session.exec(statement).all()
    # filter by time and bucket by hour
    buckets = {}
    for e in events:
        # normalize event ts
        ets = e.ts
        if ets is None:
            continue
        if ets.tzinfo is None:
            ets = ets.replace(tzinfo=timezone.utc)
        else:
            ets = ets.astimezone(timezone.utc)
        if ets < start or ets > now:
            continue
        hour_key = ets.replace(minute=0, second=0, microsecond=0).isoformat()
        try:
            payload = json.loads(e.payload) if e.payload else {}
        except Exception:
            payload = {}
        produced = int(payload.get('produced', 0))
        good = int(payload.get('good', 0))
        b = buckets.get(hour_key) or {'produced': 0, 'good': 0}
        b['produced'] += produced
        b['good'] += good
        buckets[hour_key] = b

    # build ordered list for each hour
    out = []
    for h in range(hours-1, -1, -1):
        hr = (now - timedelta(hours=h)).replace(minute=0, second=0, microsecond=0).isoformat()
        v = buckets.get(hr) or {'produced': 0, 'good': 0}
        out.append({'hour': hr, 'produced': v['produced'], 'good': v['good']})
    return out


@router.get('/orders_status')
def orders_status(session: Session = Depends(get_session), user=Depends(get_current_user)):
    statement = select(Order)
    items = session.exec(statement).all()
    counts = {}
    for o in items:
        counts[o.status] = counts.get(o.status, 0) + 1
    return [{'status': k, 'count': v} for k, v in counts.items()]


@router.get('/metrics/production')
def production_metrics(
    start: Optional[str] = Query(None, description='start ISO datetime'),
    end: Optional[str] = Query(None, description='end ISO datetime'),
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    """Aggregate production events per machine.

    Expects events with `type=='production'` and payload containing `produced` and `good` integers.
    Returns list of {source, produced, good, last_ts}.
    """
    dt_start = None
    dt_end = None
    try:
        if start:
            dt_start = datetime.fromisoformat(start)
        if end:
            dt_end = datetime.fromisoformat(end)
        # normalize to UTC-aware for comparisons
        if dt_start is not None:
            if dt_start.tzinfo is None:
                dt_start = dt_start.replace(tzinfo=timezone.utc)
            else:
                dt_start = dt_start.astimezone(timezone.utc)
        if dt_end is not None:
            if dt_end.tzinfo is None:
                dt_end = dt_end.replace(tzinfo=timezone.utc)
            else:
                dt_end = dt_end.astimezone(timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail='start/end must be ISO datetimes')

    statement = select(Event).where(Event.type == 'production')
    events = session.exec(statement).all()
    # filter by time range
    if dt_start or dt_end:
        filtered = []
        for e in events:
            ets = e.ts
            if ets is None:
                continue
            if ets.tzinfo is None:
                ets = ets.replace(tzinfo=timezone.utc)
            else:
                ets = ets.astimezone(timezone.utc)
            if dt_start and ets < dt_start:
                continue
            if dt_end and ets > dt_end:
                continue
            filtered.append(e)
    else:
        filtered = events

    agg = {}
    for e in filtered:
        try:
            payload = json.loads(e.payload) if e.payload else {}
        except Exception:
            payload = {}
        src = e.source
        produced = int(payload.get('produced', 0))
        good = int(payload.get('good', 0))
        rec = agg.get(src) or {'produced': 0, 'good': 0, 'last_ts': None}
        rec['produced'] += produced
        rec['good'] += good
        # last_ts in UTC ISO
        ets = e.ts
        if ets is not None:
            if ets.tzinfo is None:
                ets = ets.replace(tzinfo=timezone.utc)
            else:
                ets = ets.astimezone(timezone.utc)
            rec['last_ts'] = ets.isoformat()
        else:
            rec['last_ts'] = None
        agg[src] = rec

    result = []
    for src, v in agg.items():
        result.append({'machine': src, 'produced': v['produced'], 'good': v['good'], 'last_ts': v['last_ts']})
    return result
