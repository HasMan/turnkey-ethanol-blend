"""Store builder must write exactly one package to MGU_OUT, no BMW SDK."""
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
root=Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory() as td:
    env={**os.environ,'MGU_OUT':td}
    subprocess.run([sys.executable,str(root/'tools/build_store.py'),'ethanol_mix'],check=True,cwd=root,env=env)
    files=list(Path(td).iterdir())
    assert len(files)==1 and files[0].name=='ethanol_mix@0.1.5.tgz'
    with tarfile.open(files[0],'r:gz') as tar:
        names=tar.getnames()
        assert 'package/javascript/app.js' in names
        assert not any(n.startswith('package/node_modules/oap-sdk/') for n in names)
print('Stable v0.1.5 SDK-free Store package: passed')
