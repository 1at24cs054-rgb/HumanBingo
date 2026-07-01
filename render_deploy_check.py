import urllib.request, urllib.error, json
KEY='rnd_cjJTsaiNyRtjvHHjdURnhoUZGVoK'
service_id='srv-d92h75vavr4c738b7bu0'
headers={'Authorization':f'Bearer {KEY}','Accept':'application/json','Content-Type':'application/json'}

base_url=f'https://api.render.com/v1/services/{service_id}'
for path in ['', '/deploys', '/manual-deploys', '/instances']:
    if path == '':
        url = base_url
    else:
        url = base_url + path
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as r:
            data = json.load(r)
            print('---', path or '/service', '---')
            if isinstance(data, list):
                print('count=', len(data))
                for item in data[:3]:
                    print(item.get('id'), item.get('status'), item.get('createdAt') if 'createdAt' in item else item.get('updatedAt'))
            else:
                print(json.dumps(data, indent=2)[:2000])
    except urllib.error.HTTPError as e:
        print('ERROR', path, e.code, e.read().decode())
        continue

# trigger manual deploy
try:
    deploy_url = base_url + '/manual-deploys'
    req = urllib.request.Request(deploy_url, data=json.dumps({}).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as r:
        data = json.load(r)
        print('--- manual deploy started ---')
        print(json.dumps(data, indent=2)[:2000])
except urllib.error.HTTPError as e:
    print('MANUAL DEPLOY ERROR', e.code, e.read().decode())
