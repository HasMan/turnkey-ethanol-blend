# Publishing updates

`mgu-repo.json` at this repo root is used by MGU Store when a user follows **Branches → main**. No bundled BMW SDK and no release assets are required. Use semantic `x.y.z` app versions in `apps/ethanol_mix/app.json` and the component entry in `mgu-repo.json` together, updating both when publishing a new release. Git revisions of an unchanged version can be offered as revision updates when following a branch.

Local checks:

```powershell
node tests/blend.test.js
node tests/fuel_obd.test.js
python tests/test_store_metadata.py
```

Build smoke test requires locally extracted donor SDK under `oap-sdk/` and must never be run with SDK files in Git staging:

```powershell
python tools/build_store.py ethanol_mix
```

Only commit original or properly licensed source. **Never commit the generated `dist/` folder, `.mgu`, `oap-sdk/`, vehicle recordings, or keys.** Confirm `git status` before pushing. Never claim universal DME compatibility based on the one verified S58 calibration.

After testing on a physical MGU, push with standard git commands and refresh the source within MGU Store. Owners should explicitly choose whether to install updates; no unattended install is built into this project.
