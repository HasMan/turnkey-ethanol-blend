# Third-party components and attribution

This repository intentionally includes **only the TurnKey app module source**. Its imports of `./kit/*` are resolved when compiled with the separately obtained [idrive7-apps](https://github.com/cauliflowermossgrape/idrive7-apps) toolkit. No upstream runtime, C renderer, font atlas, SDK, firmware, or third-party binary is included here.

- `cauliflowermossgrape/idrive7-apps`: MIT for the toolkit generally, with separate GPL-licensed renderer/other components documented upstream.
- BMW's `oap-sdk`: copyrighted proprietary material, **not included**.
- BMW and BMW M brand names/stripes: descriptive references only; unofficial and not endorsed.

The MIT license in this repository applies to original TurnKey app code. It does not relicense the external toolkit or BMW software.
