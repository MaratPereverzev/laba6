#!/usr/bin/env python3
"""Seed the backend with production events so dashboards show real data."""
import requests
import random
import time
from datetime import datetime, timedelta

BASE = 'http://localhost:8000'

def main():
    # login
    r = requests.post(BASE + '/auth/token', data={'username':'testuser','password':'123321'})
    r.raise_for_status()
    token = r.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # get machines
    r = requests.get(BASE + '/machines/', headers=headers)
    r.raise_for_status()
    machines = r.json()
    if not machines:
        print('No machines found; creating two demo machines')
        r1 = requests.post(BASE + '/machines/', json={'name':'M-A','code':'MA'}, headers=headers)
        r2 = requests.post(BASE + '/machines/', json={'name':'M-B','code':'MB'}, headers=headers)
        machines = [r1.json(), r2.json()]

    # build events over last 12 hours
    now = datetime.utcnow()
    events = []
    for m in machines:
        # simulate hourly production for last 12 hours
        for h in range(12):
            ts = (now - timedelta(hours=h)).isoformat()
            produced = random.randint(40, 160)
            good = int(produced * random.uniform(0.9, 0.99))
            payload = {'produced': produced, 'good': good, 'ideal_cycle_time_ms': random.randint(500, 1200)}
            events.append({'source': m['name'], 'type': 'production', 'payload': payload})
        # add some downtime events
        for d in range(3):
            payload = {'duration_seconds': random.randint(60, 600)}
            events.append({'source': m['name'], 'type': 'downtime', 'payload': payload})

    # send in batches
    batch_size = 50
    for i in range(0, len(events), batch_size):
        batch = events[i:i+batch_size]
        r = requests.post(BASE + '/events/bulk', json=batch, headers=headers)
        if r.status_code not in (200,201):
            print('Failed to post batch', r.status_code, r.text)
            return
        print('Posted batch', i, '->', i+len(batch))
        time.sleep(0.2)

    print('Seeding complete')

if __name__ == '__main__':
    main()
