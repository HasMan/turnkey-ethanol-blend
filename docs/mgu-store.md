# Installing TurnKey E Blend from MGU Store

## Requirements

- iDrive 7 MGU, with user-authorized third-party app support and a functioning MGU Store installation.
- Active Store internet uplink to fetch public GitHub repository sources (or use its official offline USB flow).
- Car parked, stable electrical power and a backup before changing the app catalog.
- Installed renderer compatible with the source app. Graphics and controller input need real-car validation.

## In-car install

1. Open MGU Store → **Settings** → **Add source**.
2. Enter **`HasMan/turnkey-ethanol-blend`**.
3. Select the **main branch**. This is important: branch/tag channels read the root `mgu-repo.json`; a **Releases** channel may instead look for assets, which this source-only project does not publish.
4. Return to the Store list. Look for `TurnKey E Blend` with app ID `ethanol_mix` and iDrive 7 compatibility.
5. Install. The Store prepares an isolated checkout, injects a donor SDK from the vehicle, builds an **SDK-free OAP `.tgz`** using `tools/build_store.py`, then installs it.
6. Open the app and use manual inputs until live reads are verified against independent diagnostics for your calibration. Do not use this beta while driving.

## Updating and installed copies

Following the **main branch** enables revision-based Store updates when the repository changes. Updates are not automatic. Existing manual `ethanol_mix` apps may already occupy that app ID; avoid uninstalling or overwriting the working version before recording its configuration and taking a backup.

## Troubleshooting

- **`dist/ethanol_mix@0.1.6.tgz: cannot copy it (EEXIST)`:** This was fixed by removing `build.output` from `mgu-repo.json` because the custom builder already writes to `MGU_OUT`. Refresh the GitHub branch source in MGU Store and retry the installation. Do **not** delete installed apps or reset iDrive to resolve this package-copy error.

- **App missing from source:** ensure you selected a branch, not Releases, and `mgu-repo.json` exists at the root. Refresh/Check now.
- **Build says missing donor SDK:** the Store could not prepare its `oap-sdk` folder. Check the installed MGU Store version and its donor-bundle diagnosis; no proprietary SDK is hosted in this repository.
- **Failed to fetch repo:** confirm the MGU Store uplink is online and the repo is public, or follow the Store's offline USB instructions.
- **App opens but shows no live values:** the DME TASU path is unverified on many cars; switch to manual input and consult [compatibility](compatibility.md).
- **Graphics missing or no controller input:** confirm your installed renderer supports the upstream kit's protocol; beta interoperability has not been confirmed across all firmware versions.

This project does not provide a vehicle-flashing or rooting tool. Use only with an already authorized/configured head unit.

Source layout reference: https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md
