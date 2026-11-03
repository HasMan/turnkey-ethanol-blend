"""Offline manifest sanity checks. No BMW SDK required."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
repo = json.loads((root / 'mgu-repo.json').read_text(encoding='utf-8'))
app = json.loads((root / 'apps/ethanol_mix/app.json').read_text(encoding='utf-8'))
assert repo['schema'] == 1
assert len(repo['components']) == 1
c = repo['components'][0]
assert (c['id'], c['kind'], c['path']) == ('ethanol_mix', 'app', 'apps/ethanol_mix')
assert c['mguHmi'] == ['ID7']
assert c['build']['python'] == 'tools/build_store.py'
assert c['build']['sdk'] == 'oap-sdk'
assert 'output' not in c['build'], 'Builder writes directly to MGU_OUT; output causes a duplicate copy (EEXIST)'
assert app['id'] == c['id'] and app['version'] == c['version']
assert (root / 'apps/ethanol_mix/icon.png').stat().st_size < 128 * 1024
assert not (root / 'oap-sdk').exists(), 'Do not keep SDK in distributable repo'
print('MGU Store repo-tree metadata: all checks passed')
