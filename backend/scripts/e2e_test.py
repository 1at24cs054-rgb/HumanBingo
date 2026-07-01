import os
import requests, time
BASE=os.getenv('API_BASE_URL', 'http://127.0.0.1:8000') + '/api'
code='HB1827'

# 1) Join a new player
join_payload={'name':'BotOne','gameCode': code}
r=requests.post(f'{BASE}/games/{code}/join', json=join_payload, timeout=10)
print('join status', r.status_code, r.text)
if r.status_code!=200:
    raise SystemExit(1)
resp=r.json()
player=resp['player']
card=resp['card']
print('player id', player['id'])

# 2) Admin login
login={'username':'admin','password':'password123'}
r=requests.post(f'{BASE}/admin/login', json=login, timeout=10)
print('admin login', r.status_code, r.text)
if r.status_code!=200:
    raise SystemExit(1)
token=r.json()['access_token']
headers={'Authorization':f'Bearer {token}'}

# 3) Start game
ctrl={'status':'start'}
r=requests.post(f"{BASE}/games/{code}/control", json=ctrl, headers=headers, timeout=10)
print('control start', r.status_code, r.text)

# 4) Wait a moment for SSE notifications to propagate
time.sleep(1)

# 5) Simulate BotOne filling tile 0 with another player (if exists)
players = requests.get(f"{BASE}/games/{code}/players", timeout=10).json()
print('players list', [p['id'] for p in players])
# pick a target different from bot
target=None
for p in players:
    if p['id'] != player['id']:
        target=p['id']
        break
if not target:
    print('no target player to fill with')
else:
    fill_payload={'questionIndex':0,'filledWithPlayerId':target}
    r=requests.post(f"{BASE}/games/{code}/players/{player['id']}/fill", json=fill_payload, timeout=10)
    print('fill status', r.status_code, r.text)

# 6) Fetch leaderboard
r=requests.get(f"{BASE}/games/{code}/leaderboard", timeout=10)
print('leaderboard', r.status_code, r.text)

# 7) End the game to force results
ctrl={'status':'end'}
r=requests.post(f"{BASE}/games/{code}/control", json=ctrl, headers=headers, timeout=10)
print('control end', r.status_code, r.text)

# 8) Get results
r=requests.get(f"{BASE}/games/{code}/results", timeout=10)
print('results', r.status_code, r.text)
