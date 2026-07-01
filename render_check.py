import urllib.request, json, urllib.error
KEY='rnd_cjJTsaiNyRtjvHHjdURnhoUZGVoK'
service_id='srv-d92h75vavr4c738b7bu0'
url=f'https://api.render.com/v1/services/{service_id}'
req=urllib.request.Request(url, headers={'Authorization':f'Bearer {KEY}','Accept':'application/json'})
with urllib.request.urlopen(req) as r:
    svc=json.load(r)
print('suspended=', svc.get('suspended'))
print('url=', svc.get('url'))
print('rootDir=', svc.get('rootDir'))
print('startCommand=', svc['serviceDetails']['envSpecificDetails'].get('startCommand'))

try:
    with urllib.request.urlopen('https://humanbingo-backend.onrender.com/docs') as r:
        print('backend /docs status=', r.status)
        print(r.read(300).decode(errors='ignore'))
except urllib.error.HTTPError as e:
    print('backend /docs HTTPError', e.code)
    print(e.read(300).decode(errors='ignore'))
except Exception as e:
    print('backend access error', e)
