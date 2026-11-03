# Changelog

## v0.1.5 — restored original package for MGU Store

- Reverted the Store's published app to the original v0.1.5 source and HMI resources.
- Replaced the experimental source recompilation path with a byte-verified, SDK-free package assembled from the original working build.
- Removed the v0.1.6 inline edit interface and unsuccessful v0.1.7 renderer workaround from the published Store app.
- The Store still supplies its own BMW SDK donor on each vehicle; physical Store-install validation remains pending.

## v0.1.7-beta / v0.1.6-beta — withdrawn from published Store branch

- These builds produced blank app content when installed through the Store on the tester's X3M.
- Retained in Git history for troubleshooting, but do not install them in place of v0.1.5.
