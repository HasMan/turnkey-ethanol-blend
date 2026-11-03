"""Regression guard for software rendering on existing Store installations."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
app = json.loads((root/'apps/ethanol_mix/app.json').read_text(encoding='utf-8'))
repo = json.loads((root/'mgu-repo.json').read_text(encoding='utf-8'))
assert app['id'] == 'ethanol_mix'
assert app['version'] == repo['components'][0]['version'] == '0.1.7'
r = next(x for x in app['settings'] if x['key'] == 'renderer')
assert r['default'] == 'software'
assert isinstance(r['reset'], int) and r['reset'] > 0
assert 'software' in [x[0] for x in r['options']]
assert 'auto' in [x[0] for x in r['options']]
assert repo['components'][0]['build'].get('output') is None
print('Software-render fallback manifest: passed')
