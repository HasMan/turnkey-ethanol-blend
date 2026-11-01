#!/usr/bin/env python3
"""MGU Store on-unit builder: make an SDK-free, redistributable OAP package.

The Store injects the unit's generated oap-sdk in ./oap-sdk before calling us.
The upstream toolkit builder produces a local .mgu and .tgz with that donor SDK;
this wrapper strips the SDK from the .tgz and leaves ONLY an SDK-free .tgz
in the designated output path.  Do not distribute the intermediate .mgu.
"""
import copy
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parent.parent
APPS = ROOT / 'apps'
SDK = ROOT / 'oap-sdk'


def main():
    app_id = sys.argv[1] if len(sys.argv) > 1 else 'ethanol_mix'
    if not (app_id == 'ethanol_mix' or app_id.startswith('ethanol_mix') and app_id[len('ethanol_mix'):].isdigit()):
        sys.exit('Unexpected app id: ' + app_id)
    src = APPS / 'ethanol_mix'
    actual = APPS / app_id
    created = False
    if src != actual:
        import shutil
        if actual.exists():
            sys.exit('Build destination already exists: ' + str(actual))
        shutil.copytree(src, actual)
        created = True
    try:
        manifest = actual / 'app.json'
        raw = manifest.read_text(encoding='utf-8')
        spec = json.loads(raw)
        spec['id'] = app_id
        manifest.write_text(json.dumps(spec, indent=2) + '\n', encoding='utf-8')
        if not (SDK / 'index.js').is_file() or not (SDK / 'package.json').is_file():
            sys.exit('No donor SDK: MGU Store must inject oap-sdk via build.sdk')
        subprocess.run([sys.executable, str(ROOT / 'kit/tools/build.py'), app_id], cwd=str(ROOT), check=True)
        version = spec['version']
        compiled = ROOT / 'dist' / (app_id + '@' + version + '.tgz')
        output_dir = Path(os.environ.get('MGU_OUT', str(ROOT / 'dist'))).resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        output = output_dir / compiled.name
        # Preserve every source package entry except proprietary oap-sdk,
        # generated locally from the head unit firmware donor.
        with tempfile.NamedTemporaryFile(dir=str(output_dir), suffix='.tgz', delete=False) as temp:
            tmpname = Path(temp.name)
        try:
            with tarfile.open(compiled, 'r:gz') as src_tar, tarfile.open(tmpname, 'w:gz') as dst_tar:
                members = src_tar.getmembers()
                for member in members:
                    name = member.name.removeprefix('./')
                    if name.startswith('package/node_modules/oap-sdk/') or name == 'package/node_modules/oap-sdk':
                        continue
                    if not member.isfile():
                        dst_tar.addfile(member)
                    else:
                        data = src_tar.extractfile(member)
                        if data is None:
                            raise RuntimeError('Cannot extract ' + member.name)
                        dst_tar.addfile(member, data)
            if output.exists() and output != compiled:
                output.unlink()
            tmpname.replace(output)
        finally:
            if tmpname.exists():
                tmpname.unlink()
        # MGU Store checks the output, not the scratch build.
        with tarfile.open(output, 'r:gz') as verify:
            names = verify.getnames()
            assert 'package/package.json' in names
            assert 'package/rhmiData/application.json' in names
            assert not any('node_modules/oap-sdk/' in n for n in names)
        print('SDK-free Store package: ' + str(output))
    finally:
        if created:
            import shutil
            shutil.rmtree(actual)
        else:
            # Restore exact source manifest if running against the primary id.
            manifest.write_text(raw, encoding='utf-8')


if __name__ == '__main__':
    main()
