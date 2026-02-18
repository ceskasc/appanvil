# AppAnvil

AppAnvil is a static, client-side script generator inspired by Ninite.  
It helps you build install scripts for Winget/Chocolatey/Scoop, but it never executes installers in the browser.

## URL

- Repository name: `appanvil`
- Expected GitHub Pages URL: `https://<username>.github.io/appanvil/`
- Hash routes:
  - `#/`
  - `#/generate`
  - `#/about`
  - `#/share/<token>`

## Local Development

```bash
npm install
npm run dev
```

Build and test:

```bash
npm test
npm run build
```

## GitHub Pages Deployment (GitHub Actions)

1. Push this project to the `appanvil` repository on GitHub.
2. In GitHub: `Settings -> Pages`.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Ensure default branch is `main` (or update workflow branch trigger if different).
5. Push to `main`; workflow runs tests, builds, and deploys `dist/`.

Workflow file: `.github/workflows/deploy.yml`

## Stack

- Vite (vanilla) + TypeScript
- Tailwind CSS
- Fuse.js (search)
- LZ-String (share token compression)
- Zod (validation)
- Vitest (tests)

## Safety Notes

- Review scripts before running.
- This website does not execute installers.
- Imported/share payloads are validated before being applied.
