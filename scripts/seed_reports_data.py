"""
Seeder for reports: posts production and downtime events and some orders so reports show non-zero values.
Usage:
  # ensure backend is running
  API_URL=http://localhost:8000 ADMIN_USER=admin ADMIN_PASS=adminpass python3 scripts/seed_reports_data.py

Environment variables (optional):
  API_URL - base URL of API (default http://localhost:8000)
  ADMIN_USER - admin username (default 'admin')
  ADMIN_PASS - admin password (default 'admin')
  MACHINES - number of machines to create/use (default 4)
  EVENTS_PER_MACHINE - number of production events per machine (default 20)
  HOURS_SPAN - how many past hours to spread events across (default 12)

The script will:
 - login to /auth/token
 - ensure there are machines (create if none)
 - post production events (with historical `ts`) in batches to /events/bulk
 - post a few downtime events
 - create several orders with different statuses
"""

import os
import sys
import time
import random
from datetime import datetime, timedelta
import requests

API_URL = os.environ.get('API_URL', 'http://localhost:8000')
ADMIN_USER = os.environ.get('ADMIN_USER', 'admin')
ADMIN_PASS = os.environ.get('ADMIN_PASS', 'adminpass')
MACHINES = int(os.environ.get('MACHINES', '4'))
EVENTS_PER_MACHINE = int(os.environ.get('EVENTS_PER_MACHINE', '20'))
HOURS_SPAN = int(os.environ.get('HOURS_SPAN', '12'))

session = requests.Session()

def login():
    url = f"{API_URL}/auth/token"
    data = {'username': ADMIN_USER, 'password': ADMIN_PASS}
    r = session.post(url, data=data)
    if not r.ok:
        print('Login failed:', r.status_code, r.text)
        return None
    return r.json().get('access_token')


def ensure_machines(headers):
    r = session.get(f"{API_URL}/machines/", headers=headers)
    if r.ok and isinstance(r.json(), list) and r.json():
        print('Found existing machines:', [m.get('name') for m in r.json()])
        return r.json()
    # create machines
    created = []
    for i in range(1, MACHINES+1):
        payload = {'name': f'Machine-{i}', 'code': f'M{i:03d}'}
        r = session.post(f"{API_URL}/machines/", json=payload, headers=headers)
        if r.ok:
            created.append(r.json())
        else:
            print('Failed to create machine', payload, r.status_code, r.text)
    print('Created machines:', [m.get('name') for m in created])
    return created


def post_events_for_machine(machine_name, headers):
    now = datetime.utcnow()
    events = []
    for i in range(EVENTS_PER_MACHINE):
        # spread across last HOURS_SPAN hours
        offset_hours = random.randint(0, HOURS_SPAN-1)
        ts = (now - timedelta(hours=offset_hours, minutes=random.randint(0,59), seconds=random.randint(0,59))).isoformat()
        produced = random.randint(50, 200)
        good = produced - random.randint(0, max(1, int(produced*0.05)))
        evt = {
            'source': machine_name,
            'type': 'production',
            'payload': {
                'produced': produced,
                'good': good,
                'ideal_cycle_time_ms': random.randint(600, 1200)
            },
            'ts': ts
        }
        events.append(evt)
        # occasionally add a downtime event
        if random.random() < 0.05:
            dt = {
                'source': machine_name,
                'type': 'downtime',
                'payload': {'duration_seconds': random.randint(30, 600)},
                'ts': (now - timedelta(hours=random.randint(0, HOURS_SPAN-1))).isoformat()
            }
            events.append(dt)
    # post in batches of 50
    for i in range(0, len(events), 50):
        batch = events[i:i+50]
        r = session.post(f"{API_URL}/events/bulk", json=batch, headers=headers)
        if r.ok:
            print(f'Posted batch {i//50} for {machine_name} -> {len(batch)}')
        else:
            print('Failed posting events batch:', r.status_code, r.text)
            print('Batch sample:', batch[:2])
            return False
        time.sleep(0.1)
    return True


def create_orders(headers):
    statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    for i in range(1, 8):
        payload = {
            'order_number': f'ORD-{int(time.time())}-{i}',
            'product': f'Product-{random.randint(1,5)}',
            'quantity': random.randint(1, 200),
            'priority': random.randint(1,5),
            'status': random.choice(statuses)
        }
        r = session.post(f"{API_URL}/orders/", json=payload, headers=headers)
        if r.ok:
            print('Created order', r.json().get('order_number'), 'status', payload['status'])
        else:
            print('Failed creating order', r.status_code, r.text)


def main():
    token = login()
    if not token:
        print('Cannot seed without admin token. Set ADMIN_USER and ADMIN_PASS or create admin first.')
        sys.exit(1)
    headers = {'Authorization': f'Bearer {token}'}

    machines = ensure_machines(headers)
    machine_names = [m.get('name') or m.get('code') or str(m.get('id')) for m in machines]

    for mname in machine_names:
        ok = post_events_for_machine(mname, headers)
        if not ok:
            print('Stopping due to errors')
            break

    # create orders to populate orders_status report
    create_orders(headers)
    print('Seeding complete')


if __name__ == '__main__':
    main()
