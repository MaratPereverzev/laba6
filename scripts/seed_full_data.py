#!/usr/bin/env python3
"""Seed full dataset: admin user, several users, machines, orders, and events."""
import requests
import time
import random
from datetime import datetime, timedelta

BASE = 'http://localhost:8000'

def register_user(username, password, full_name='', role='planner'):
    r = requests.post(BASE + '/auth/register', json={'username': username, 'password': password, 'full_name': full_name, 'role': role})
    return r

def login(username, password):
    r = requests.post(BASE + '/auth/token', data={'username': username, 'password': password})
    r.raise_for_status()
    return r.json()['access_token']

def main():
    # try to register admin (allowed only if no admin exists)
    try:
        r = register_user('admin', 'adminpass', 'Administrator', 'admin')
        if r.status_code == 200:
            print('Admin registered')
        else:
            print('Admin register response:', r.status_code, r.text)
    except Exception as e:
        print('Admin register failed', e)

    # login as admin if possible, else try testuser
    token = None
    try:
        token = login('admin', 'adminpass')
        print('Logged in as admin')
    except Exception:
        try:
            token = login('testuser', '123321')
            print('Logged in as testuser')
        except Exception as e:
            print('Could not login as admin or testuser:', e)
            return

    headers = {'Authorization': f'Bearer {token}'}

    # create additional users (if admin)
    try:
        users = [
            ('planner1','pass1','Planner One','planner'),
            ('operator1','pass2','Operator One','operator'),
            ('viewer1','pass3','Viewer One','viewer'),
        ]
        for u in users:
            print('Creating user', u[0])
            requests.post(BASE + '/users/', json={'username':u[0],'password':u[1],'full_name':u[2],'role':u[3]}, headers=headers)
    except Exception as e:
        print('Create users failed', e)

    # create machines
    machines = []
    for i in range(4):
        name = f'Machine-{i+1}'
        r = requests.post(BASE + '/machines/', json={'name':name,'code':f'MC{i+1}'}, headers=headers)
        if r.status_code==200:
            machines.append(r.json())
    print('Created machines:', [m['name'] for m in machines])

    # create orders
    for i in range(8):
        r = requests.post(BASE + '/orders/', json={'order_number':f'ORD-{100+i}','product':f'Prod-{i%3}','quantity':random.randint(1,200),'priority':random.randint(1,3)}, headers=headers)
    print('Created orders')

    # create production and downtime events
    now = datetime.utcnow()
    events = []
    for m in machines:
        for h in range(12):
            produced = random.randint(50,200)
            good = int(produced * random.uniform(0.9, 0.99))
            payload = {'produced': produced, 'good': good, 'ideal_cycle_time_ms': random.randint(500, 1200)}
            events.append({'source': m['name'], 'type': 'production', 'payload': payload})
        for d in range(5):
            payload = {'duration_seconds': random.randint(30, 600)}
            events.append({'source': m['name'], 'type': 'downtime', 'payload': payload})

    # post in batches
    for i in range(0, len(events), 50):
        b = events[i:i+50]
        r = requests.post(BASE + '/events/bulk', json=b, headers=headers)
        print('Posted events batch', i, 'status', r.status_code)
        time.sleep(0.1)

    print('Seeding complete')

if __name__ == '__main__':
    main()
