import urllib.request, urllib.error, json
url = 'https://humanbingo-backend.onrender.com/docs'
try:
    with urllib.request.urlopen(url, timeout=20) as r:
        print('status', r.status)
        data = r.read(500).decode(errors='ignore')
        print('body preview:', data[:300])
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
    print(e.read(500).decode(errors='ignore'))
except Exception as e:
    print('error', type(e).__name__, e)
