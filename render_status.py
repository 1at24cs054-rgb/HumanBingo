import urllib.request, urllib.error, json
KEY='rnd_cjJTsaiNyRtjvHHjdURnhoUZGVoK'
service_id='srv-d92h75vavr4c738b7bu0'
url=f'https://api.render.com/v1/services/{service_id}'
req=urllib.request.Request(url, headers={'Authorization':f'Bearer {KEY}','Accept':'application/json'})
with urllib.request.urlopen(req) as r:
    svc=json.load(r)
print('keys=', sorted(svc.keys()))
print('top-level url=', svc.get('url'))
print('dashboardUrl=', svc.get('dashboardUrl'))
print('slug=', svc.get('slug'))
print('suspended=', svc.get('suspended'))
print('service type=', svc.get('type'))
print('live deploy status=', svc.get('currentDeploy', {}).get('status'))
print('createdAt=', svc.get('createdAt'))
print('updatedAt=', svc.get('updatedAt'))
print('health path=', svc['serviceDetails'].get('healthCheckPath'))
print('startCommand=', svc['serviceDetails']['envSpecificDetails'].get('startCommand'))
print('rootDir=', svc.get('rootDir'))

for key in ['webhookUrl','internalUrl','branch','ownerId']:
    if key in svc:
        print(key, svc[key])

try:
    with urllib.request.urlopen('https://humanbingo-backend.onrender.com/docs') as r:
        print('backend /docs status=', r.status)
        print(r.read(300).decode(errors='ignore'))
except urllib.error.HTTPError as e:
    print('backend /docs HTTPError', e.code)
    print(e.read(300).decode(errors='ignore'))
except Exception as e:
    print('backend access error', type(e).__name__, e)
