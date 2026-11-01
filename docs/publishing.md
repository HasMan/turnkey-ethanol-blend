# Publishing on GitHub

Recommended repo: `turnkey-ethanol-blend`. Publish source under the MIT license only after confirming you have the right to license the original files.

```powershell
# Unpack the provided GitHub-ready ZIP into C:\MGU\turnkey-ethanol-blend
cd C:\MGU\turnkey-ethanol-blend
git init
git add .
git commit -m "Initial public beta source: TurnKey E Blend v0.1.6"
git branch -M main
```

Create a **public, empty** GitHub repository at https://github.com/new (don't add a separate README or license there). Then:

```powershell
git remote add origin https://github.com/YOUR_ACCOUNT/turnkey-ethanol-blend.git
git push -u origin main
git tag v0.1.6-beta
git push origin v0.1.6-beta
```

Make a GitHub Release from `v0.1.6-beta`, and attach only this source ZIP or a source tarball. **Do not attach the compiled `.mgu`**: the upstream kit indicates those artifacts embed BMW's copyrighted SDK and should not be publicly distributed without permission.

After establishing licensing for a redistributable binary, revisit MGU Store listing/submission; the source repository alone doesn't automatically make an installable store app.
