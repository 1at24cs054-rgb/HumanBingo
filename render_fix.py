import json, urllib.request
KEY = 'rnd_cjJTsaiNyRtjvHHjdURnhoUZGVoK'
service_id = 'srv-d92h75vavr4c738b7bu0'
url = f'https://api.render.com/v1/services/{service_id}'
body = {
    'rootDir': 'backend',
    'serviceDetails': {
        'envSpecificDetails': {
            'buildCommand': 'pip install -r requirements.txt',
            'startCommand': 'gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT'
        }
    }
}
req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), method='PATCH')
req.add_header('Accept', 'application/json')
req.add_header('Content-Type', 'application/json')
req.add_header('Authorization', f'Bearer {KEY}')
try:
    resp = urllib.request.urlopen(req)
    print('PATCH OK', resp.read().decode())
except urllib.error.HTTPError as e:
    print('PATCH ERROR', e.code, e.read().decode())
    raise

resume_url = f'https://api.render.com/v1/services/{service_id}/resume'
req = urllib.request.Request(resume_url, data=b'', method='POST')
req.add_header('Accept', 'application/json')
req.add_header('Content-Type', 'application/json')
req.add_header('Authorization', f'Bearer {KEY}')
try:
    resp = urllib.request.urlopen(req)
    print('RESUME OK', resp.read().decode())
except urllib.error.HTTPError as e:
    print('RESUME ERROR', e.code, e.read().decode())
    raise
