# Compatibility and safety

## Verified independently (ENET to the DME)

- 2023 X3 M Competition with one specific S58 calibration.
- Read one byte from DME logical target `0x12` memory `0xB00060D2`: request `23 14 B0 00 60 D2 01` and response `63 2B` indicated E43 at the time of test.
- Fuel-level OBD PID `0x2F`: request `01 2F` and example response `41 2F DD`, decoded as `221 / 255 * 100 = 86.67%`.
- A captured MHD diagnostic log independently correlated the memory byte to E43–E44 transitions. The capture and VIN-bearing logs are deliberately **not published**.

## Not yet broadly validated

- This memory address may be invalid, unrelated or unreadable on another calibration/ROM.
- Continuous 1-second target reads through MGU TASU were not proven stable across vehicles. Do not treat the UI as a certified real-time instrument.
- KOMBI raw/60 scaling is an **experimental hypothesis**, not an established BMW conversion.
- Native controller editor on v0.1.6 was tested in desktop simulation, not confirmed on a physical head unit.

## Safety

- This is a hobbyist application for user-authorized, already-modified MGUs. Changes to vehicle software can cause malfunctions and may void warranties.
- No flashing, coding, security unlocking, or CAN injection is implemented by this calculator; diagnostic read requests are still active bus traffic and can fail or impose load.
- Don't interact with settings or calculate fueling quantities while driving. Park before using the editor and before fueling.
- Confirm actual tank size, current content, pump ethanol percentage, and tune limits independently. Fuel-level PID 2F is an estimate, not a volumetric fill gauge.
- Keep a backup and use manual readings if live values are stale or unavailable.
