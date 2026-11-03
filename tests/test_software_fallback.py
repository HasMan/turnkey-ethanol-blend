"""Regression: stable Store build uses the actual v0.1.5 UI, not v0.1.7 workaround."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
app=json.loads((root/'apps/ethanol_mix/app.json').read_text())
assert app['version']=='0.1.5'
renderer=next((x for x in app['settings'] if x['key']=='renderer'),None)
assert renderer is not None and renderer.get('default')=='auto'
assert not renderer.get('reset'), 'Do not force the previously unsuccessful software-render migration'
print('Original v0.1.5 renderer settings restored: passed')
