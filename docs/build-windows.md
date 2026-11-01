# Windows source build

This guide does **not** flash or root the vehicle. It assumes that you already have authorized SSH access to your own MGU and have the upstream toolkit. Work with the car parked and on stable power.

1. Install Node.js LTS and Python 3.
2. In PowerShell:

```powershell
cd C:\MGU
git clone https://github.com/cauliflowermossgrape/idrive7-apps.git
git clone https://github.com/YOUR_ACCOUNT/turnkey-ethanol-blend.git
Copy-Item -Recurse -Force '.\turnkey-ethanol-blend\apps\ethanol_mix' '.\idrive7-apps\apps\ethanol_mix'
cd .\idrive7-apps
```

3. Extract your *own* firmware's `x_call` app and follow [upstream SDK extraction instructions](https://github.com/cauliflowermossgrape/idrive7-apps#31-get-the-sdk-from-your-unit). Ensure `oap-sdk/index.js` exists under the `idrive7-apps` kit folder. Never upload that directory.

```powershell
python .\kit\tools\build.py ethanol_mix
Get-Item '.\dist\ethanol_mix@0.1.6.mgu'
```

4. Before installing the locally built package, use the upstream compatibility/check and backup steps. The upstream kit's `mgu-app-install.sh` supports per-app verification/install on configured head units; the exact commands depend on how your MGU was provisioned. Do not assume this app is compatible with other DMEs.

> Note: The example GitHub path contains a placeholder `YOUR_ACCOUNT`. Replace it with the actual owner after the repository is published. No SSH private keys, firmware images, VINs, raw logs, or copyrighted BMW SDK files are in this public project.
