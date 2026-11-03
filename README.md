# TurnKey E Blend — Stable v0.1.5 source

**Independent BMW iDrive 7 / MGU ethanol monitoring and fuel blending calculator** from TurnKey Performance.

**Status:** Original v0.1.5 app files restored. The original v0.1.5 was verified working when manually installed on a 2023 BMW X3 M Competition; this new MGU Store distribution path **still requires vehicle-side validation**. Newer v0.1.6–0.1.7 builds had a blank app-content issue through the Store and are withdrawn from the current Store source.

## Install from MGU Store

1. Open **MGU Store** on a compatible, user-authorized iDrive 7 head unit.
2. Add GitHub source **`HasMan/turnkey-ethanol-blend`** and select **Branches → main**.
3. Refresh. Check that the offered app is **TurnKey E Blend 0.1.5**.
4. Install while parked, after backing up any older or modified app. If v0.1.7 is already installed, the Store may not allow an in-place downgrade; follow [the downgrade notes](docs/mgu-store.md).

The Store builds a standard `.tgz` OAP package from the **exact v0.1.5 app tree** recorded under `store-v015/package/`, then supplies the SDK from its own BMW app donor. We do **not** redistribute BMW's proprietary SDK.

## What this app does

- Reads S58 ethanol percentage with a calibration-specific, read-only DME RAM request.
- Supports fuel-level PID 2F, an experimental KOMBI source, and manual fallback.
- Computes fuel quantities to reach a requested ethanol blend.
- Uses four M-inspired pages and the original v0.1.5 BMW native input editors.

**Compatibility limitations:** The DME address `0xB00060D2` was checked only for one CD919-tuned X3M. Other BMW calibrations and versions can behave differently. Do not use unverified readings for real-world fueling, and do not change inputs while driving. The app is unofficial and not affiliated with BMW or MHD.

## Full source and reproducibility

The original v0.1.5 editable source is under `apps/ethanol_mix/` (`app.json`, `main.js`, `blend.js`, `fuel_obd.js`). The MIT-licensed iDrive7 toolkit subset remains under `kit/` with its existing license notices.

`store-v015/package/` contains every original OAP runtime and RHMI resource **except the BMW SDK**. `store-v015/original_file_sha256.json` contains per-file SHA-256 checksums from the original v0.1.5 `.mgu` archive. The Store build never regenerates screens: it only validates and packages those files. You can modify and rebuild the editable source separately, but that would be a *new, unvalidated build*.

### Test and build an SDK-free Store artifact

```bash
node tests/blend.test.js
node tests/fuel_obd.test.js
python tests/test_store_metadata.py
python tests/test_store_output_contract.py
python tests/test_software_fallback.py
python tools/build_store.py ethanol_mix
```

Upload only the generated **`dist/ethanol_mix@0.1.5.tgz`** as a GitHub Release asset, if you want the Store's *Releases* channel too. Do **not** upload the original `.mgu` file or commit a local `oap-sdk/` directory.

See [Store instructions](docs/mgu-store.md) and [licensing notes](THIRD_PARTY.md).
