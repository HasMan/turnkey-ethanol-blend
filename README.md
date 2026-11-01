# TurnKey E Blend

**Open-source ethanol monitor and E85 blend-to-full calculator for modified BMW iDrive 7 / MGU head units.**

![Blend dashboard](assets/screenshots/blend.png)

> **Beta — v0.1.6 source.** The inline editor was tested in a desktop preview, **not yet verified on the physical MGU**. On one 2023 BMW X3 M Competition, standalone ENET tests verified the ethanol RAM read and OBD fuel-level response. This does **not** establish universal BMW compatibility or validate the same requests through every MGU TASU gateway. The app is unofficial; it is not affiliated with BMW, MHD, or any fuel manufacturer.

## Features

- Read-only ethanol monitoring using a **calibration-specific** diagnostic memory address (should only be used after verifying compatibility).
- Fuel-level reading using standardized OBD Mode 01 PID `0x2F`; experimental KOMBI raw/60 alternative and manual override.
- Inputs for tank size, pump 93 ethanol %, pump E85 ethanol %, and desired E%.
- Blend-to-full result estimating how many US gallons of each fuel to add, or warning if target is mathematically impossible.
- Controller-operated editor and BMW M-inspired tri-color design.
- Sequential diagnostic polling with 1-second **target** interval; errors/backoff can make updates slower. Only polls while the app is displayed.

## Compatibility

**Known test setup:** 2023 X3 M Competition (F97 LCI), S58, iDrive 7 MGU, with a CD919/MHD flex-fuel calibration. DME logical address `0x12`; ethanol RAM `0xB00060D2`; response `63 2B` corresponded to E43 in a test, cross-checked with an MHD log. Fuel level `01 2F` returned `41 2F DD` (86.67%) over ENET. This address **must not be assumed to work on another DME or calibration**.

The default tank capacity in the app is **17.2 US gal**. Confirm the tank specification and actual fuel blend for your vehicle. Calculations assume an ideal, homogeneous mixture and do not account for fuel trapped in lines, sensor error, temperature effects, or dispenser variability. **Do not make fueling decisions based only on an unverified gauge or experimental KOMBI conversion.**

## Build from source (Windows / macOS / Linux)

This project is an app module for the independent [cauliflowermossgrape/idrive7-apps](https://github.com/cauliflowermossgrape/idrive7-apps) toolkit. The toolkit and BMW's SDK are **not vendored** here.

1. Install Python 3 and Node.js LTS.
2. Clone the upstream kit: `git clone https://github.com/cauliflowermossgrape/idrive7-apps.git`.
3. Copy this repository's `apps/ethanol_mix/` folder into the upstream kit's `apps/ethanol_mix/` directory.
4. Follow the upstream README to **extract `oap-sdk/` from your own MGU** using its `kit/tools/extract_sdk.js`. Do **not** commit or distribute that SDK.
5. From the upstream kit directory, run: `python kit/tools/build.py ethanol_mix`.
6. The local output will be `dist/ethanol_mix@0.1.6.mgu`. Install only after verifying the installer/package is compatible with your specific MGU. On your own vehicle, follow the upstream deploy/check procedure and maintain a backup.

For exact Windows commands, see [docs/build-windows.md](docs/build-windows.md). For compatibility and safety notes, see [docs/compatibility.md](docs/compatibility.md).

### Run calculation tests without a BMW

```bash
node tests/blend.test.js
node tests/fuel_obd.test.js
```

## Source layout

```text
apps/ethanol_mix/app.json       App manifest, screens, settings and SOME/IP subscriptions
apps/ethanol_mix/main.js        UI, sequential DME reads, page navigation and input editing
apps/ethanol_mix/blend.js       Pure blend-to-full math
apps/ethanol_mix/fuel_obd.js    OBD PID 2F decoder
tests/                            No-car tests for blend math and fuel PID decoding
assets/screenshots/              Desktop preview images
docs/                            Build, compatibility, distribution notes
```

## Distribution and licensing

The **original code in this repository** is released under the MIT license. The upstream `idrive7-apps` toolkit has its own licenses and notices; respect them when using its runtime and renderer. BMW's `oap-sdk` is proprietary and must be extracted by each builder from their own unit. **Do not upload `.mgu` bundles generated with BMW's SDK to public GitHub Releases** or commit the SDK. Source releases are suitable for GitHub; independently distributing binaries would require separate rights clearance.

M-inspired graphic elements and product names do not imply any endorsement or official status.

## Credits

- [cauliflowermossgrape/idrive7-apps](https://github.com/cauliflowermossgrape/idrive7-apps) — independent MGU app toolkit (not bundled).
- MGU Store by [robertnisipeanu](https://github.com/robertnisipeanu/mgu-store) — separate community distribution ecosystem. This repository is **not automatically listed** in MGU Store.
