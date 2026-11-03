## v0.1.7-beta — software-render recovery test

- Defaults to software rendering instead of the optional `mgu-render` GPU overlay.
- One-time `renderer` settings migration (`reset: 1`) also changes persisted `auto` values to `software` on update. User can re-enable GPU rendering later if desired.
- Keeps app ID `ethanol_mix`, calculation code, and all fuel input settings unchanged.
- Investigates an in-car blank canvas after Store installation; **not yet verified on the vehicle**. If the canvas remains blank, collect `ethanol_mix.log` and do not guess at further fixes.
- No BMW SDK distributed.

# Changelog

## v0.1.6-beta (source preview)

- Reworked input editing into an in-screen controller-operated editor.
- Retained sequential diagnostics with a one-second target interval.
- Supports DME PID 2F, manual fuel percentage and experimental KOMBI raw/60.
- Kept M-inspired colors, four pages and ethanol blend-to-full calculator.
- Physical-MGU editor functionality has not yet been verified.

## v0.1.5 (previous in-car build)

- Introduced native BMW dropdown editor, which did not render reliably on the test vehicle.

## MGU Store source distribution (repository update)
- Added root `mgu-repo.json` for iDrive 7 branch-based repository source.
- Added source-build wrapper producing SDK-free `.tgz` using the Store's donor SDK.
- Included a minimal MIT-licensed upstream build/runtime subset with attribution.
- Added Store installation and troubleshooting documentation, icon, CI and manifest tests.
- Application features and version remain **0.1.6-beta**, pending physical head-unit testing.
