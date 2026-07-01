import urllib.request
import urllib.error
import json

KEY = 'rnd_cjJTsaiNyRtjvHHjdURnhoUZGVoK'
service_id = 'srv-d92h75vavr4c738b7bu0'
headers = {
    'Authorization': f'Bearer {KEY}',
    'Accept': 'application/json',
}

def fetch(path):
    url = f'https://api.render.com/v1/services/{service_id}{path}'
    print('---', path or '/service', '---')
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
            print('OK', path, type(data).__name__)
            if isinstance(data, list):
                print('count', len(data))
                for item in data[:5]:
                    print(json.dumps(item, indent=2)[:1200])
            else:
                print('keys', list(data.keys()))
                print(json.dumps(data, indent=2)[:1200])
    except urllib.error.HTTPError as e:
        print('HTTPError', path, e.code)
        print(e.read(2000).decode(errors='ignore'))
    except Exception as e:
        print('ERROR', path, type(e).__name__, e)

for path in ['', '/deploys']:
    fetch(path)

print('--- deploy details ---')
try:
    deploy_id = 'dep-d92h76favr4c738b7ca0'
    url = f'https://api.render.com/v1/services/{service_id}/deploys/{deploy_id}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.load(r)
        print('deploy detail keys', list(data.keys()))
        print(json.dumps(data, indent=2)[:2000])
except Exception as e:
    print('deploy detail error', type(e).__name__, e)

for param in ['resourceId', 'serviceId', 'name']:
    try:
        url = f'https://api.render.com/v1/logs?{param}={service_id}&limit=20'
        print('--- logs query', url)
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
            print('OK logs', type(data).__name__)
            if isinstance(data, list):
                print('count', len(data))
                for item in data[:5]:
                    print(json.dumps(item, indent=2)[:1000])
            else:
                print('keys', list(data.keys()))
                print(json.dumps(data, indent=2)[:1000])
    except urllib.error.HTTPError as e:
        print('HTTPError logs', param, e.code)
        print(e.read(2000).decode(errors='ignore'))
    except Exception as e:
        print('ERROR logs', param, type(e).__name__, e)
