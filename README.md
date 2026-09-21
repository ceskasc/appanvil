# Appanvil

**Pick your apps. Forge one setup.**

Appanvil is a static, privacy-friendly setup builder inspired by the convenience of Ninite. It lets users choose applications and generates a readable installation script using the native package ecosystem for their operating system.

## Current MVP

- Windows installer scripts via **winget**
- macOS installer scripts via **Homebrew**
- Linux installer scripts via **Flatpak**
- Responsive app catalog with search and categories
- No account required
- No application binaries are proxied or repackaged
- Generated scripts are created locally in the browser

## How it works

1. Pick a platform.
2. Select supported applications.
3. Click **Forge installer**.
4. Inspect or download the generated script.
5. Run it on the target machine.

## Architecture

The current site is deliberately static and deploys directly to GitHub Pages. This keeps the public MVP simple and auditable. A future native Appanvil installer can be added as a signed desktop/bootstrap executable without changing the catalog UX.

## Development

No build step is required.

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Security model

Appanvil does not host third-party installers. It generates commands for recognized package managers and leaves the resulting script visible to the user before execution.

## License

Project code © Appanvil. Add an explicit open-source license before accepting external contributions.
