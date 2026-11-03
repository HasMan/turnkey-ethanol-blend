"""Version, source identity, and ownership checks for stable v0.1.5."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
repo=json.loads((root/'mgu-repo.json').read_text())
app=json.loads((root/'apps/ethanol_mix/app.json').read_text())
comp=repo['components'][0]
assert repo['schema']==1 and len(repo['components'])==1
assert (comp['id'],comp['path'],comp['version'])==('ethanol_mix','apps/ethanol_mix','0.1.5')
assert comp['mguHmi']==['ID7'] and comp['build']['python']=='tools/build_store.py'
assert 'output' not in comp['build']
assert app['id']==comp['id'] and app['version']==comp['version']
assert (root/'store-v015/package/node_modules/oap-sdk').exists() is False
assert (root/'apps/ethanol_mix/icon.png').stat().st_size < 128 * 1024
print('MGU Store stable v0.1.5 metadata: passed')
