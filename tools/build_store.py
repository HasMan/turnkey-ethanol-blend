#!/usr/bin/env python3
"""MGU Store builder: pack the exact original v0.1.5 OAP tree, excluding BMW SDK.

The original v0.1.5 source/ tree was recovered from the working .mgu archive.
The proprietary node_modules/oap-sdk is NOT stored in the GitHub repository or
output archive. MGU Store fills missing SDK using a donor from the user's car.
No UI source is recompiled and no RHMI resources are regenerated.
"""
import hashlib
import json
import os
from pathlib import Path
import sys
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parent.parent
TREE = ROOT / 'store-v015' / 'package'
HASHES = ROOT / 'store-v015' / 'original_file_sha256.json'


def main():
    app_id = sys.argv[1] if len(sys.argv) > 1 else 'ethanol_mix'
    if app_id != 'ethanol_mix':
        sys.exit('This frozen original package only supports id=ethanol_mix, got ' + app_id)
    manifest = json.loads(HASHES.read_text(encoding='utf-8'))
    expected = manifest['file_sha256']
    actual = {
        p.relative_to(TREE).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in TREE.rglob('*') if p.is_file()
    }
    if actual != expected:
        missing = sorted(set(expected) - set(actual))
        extra = sorted(set(actual) - set(expected))
        changed = sorted(k for k in set(actual) & set(expected) if actual[k] != expected[k])
        sys.exit(f'Frozen v0.1.5 contents changed. Missing={missing}, extra={extra}, changed={changed}')
    if any(p.startswith('node_modules/oap-sdk/') for p in actual):
        sys.exit('BMW SDK MUST NOT be packed or committed')
    pkg = json.loads((TREE / 'package.json').read_text(encoding='utf-8'))
    if pkg.get('name') != app_id or pkg.get('version') != '0.1.5':
        sys.exit('Unexpected source package identity/version')
    outdir = Path(os.environ.get('MGU_OUT', str(ROOT / 'dist'))).resolve()
    outdir.mkdir(parents=True, exist_ok=True)
    output = outdir / 'ethanol_mix@0.1.5.tgz'
    with tempfile.NamedTemporaryFile(dir=str(outdir), prefix='.ethanol_mix_', suffix='.tgz', delete=False) as f:
        temp = Path(f.name)
    try:
        with tarfile.open(temp, 'w:gz') as tar:
            for p in sorted(TREE.rglob('*')):
                if not p.is_file():
                    continue
                rel = p.relative_to(TREE).as_posix()
                # Include the OAP package rooted under `package/`, like npm pack.
                info = tar.gettarinfo(str(p), arcname='package/' + rel)
                info.uid = info.gid = 0
                info.uname = info.gname = ''
                info.mtime = 0
                with p.open('rb') as handle:
                    tar.addfile(info, handle)
        temp.replace(output)
    finally:
        if temp.exists():
            temp.unlink()
    with tarfile.open(output, 'r:gz') as tar:
        names = tar.getnames()
        assert 'package/javascript/app.js' in names
        assert 'package/rhmiData/application.json' in names
        assert 'package/package.json' in names
        assert not any('node_modules/oap-sdk/' in n for n in names)
    print('Verified frozen original v0.1.5 Store package: ' + str(output))


if __name__ == '__main__':
    main()
