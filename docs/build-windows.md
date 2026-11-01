# Windows source build

Local builds require your own legitimately obtained SDK, which is never committed or included in this GitHub repository.

```powershell
cd C:\MGU
git clone https://github.com/HasMan/turnkey-ethanol-blend.git
cd .\turnkey-ethanol-blend
```

Follow the [upstream kit's SDK extraction procedure](https://github.com/cauliflowermossgrape/idrive7-apps) using your own BMW MGU. Copy the locally generated `oap-sdk/` into the root of this project. Check `oap-sdk/index.js` and `oap-sdk/package.json` exist. Do not commit that directory.

```powershell
# Local-only .mgu build (contains your extracted SDK; DO NOT publish)
python .\kit\tools\build.py ethanol_mix

# SDK-free OAP .tgz for Store packaging verification
python .\tools\build_store.py ethanol_mix

# Test the math and fuel-PID parser without a car
node .\tests\blend.test.js
node .\tests\fuel_obd.test.js
python .\tests\test_store_metadata.py
```

The Store itself does this through `MGU_SDK_DONOR` and the injected `oap-sdk/` folder, so end users do not need a Windows computer for source-based installation. Never add an extracted SDK, `.mgu`, VIN-bearing logs or SSH credentials to GitHub.
