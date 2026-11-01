# Third-party components and attribution

The original TurnKey app module (`apps/ethanol_mix/main.js`, `blend.js`, `fuel_obd.js` and app manifest) is MIT-licensed by the TurnKey project.

## Included independent toolkit code

A limited subset of `cauliflowermossgrape/idrive7-apps` is included so MGU Store can build this app offline, directly on an authorized head unit:

- `kit/runtime/` (JavaScript runtime, fonts and supporting resources)
- `kit/tools/build.py`, `localize.py`, `pack_data.py`, `make_icon.js`, `locale-revisions.json`, `oapgen/gen.js`
- `kit/platform/permissions.json`

These files are from the publicly released MIT-licensed `cauliflowermossgrape/idrive7-apps` toolkit. Retain `LICENSE.idrive7-apps` and all existing notices. Some font assets have their own accompanying license: `kit/runtime/fonts/OFL-NotoSansSC.txt`.

This repository does **not** include the upstream GPL/native renderer, its binary, or unrelated apps, and it does **not** claim the BMW SDK is open source.

## Not included / not redistributable

- BMW's proprietary `oap-sdk` (extracted locally by the MGU Store or by the owner from their own head unit)
- Vehicle firmware, diagnostic recordings, VINs, authentication tokens, SSH keys or user data
- Any compiled `.mgu` carrying an extracted BMW SDK

MGU Store itself remains a separate project by `robertnisipeanu` under its own license. BMW, BMW M, MHD and other brands are referenced for compatibility only; no affiliation or endorsement is claimed.
