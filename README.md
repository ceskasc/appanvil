<div align="center">
  <img src="./public/logo1.svg" alt="AppAnvil logo" width="96" />
  <h1>AppAnvil</h1>
  <p><strong>Build software install profiles in minutes. Native EXE workflow is next.</strong></p>
  <p>
    <a href="https://github.com/ceskasc/appanvil/actions/workflows/deploy.yml"><img alt="Deploy" src="https://img.shields.io/github/actions/workflow/status/ceskasc/appanvil/deploy.yml?branch=main&label=deploy" /></a>
    <img alt="Vite" src="https://img.shields.io/badge/Vite-7.x-646CFF" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6" />
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-3.x-06B6D4" />
    <img alt="Static SPA" src="https://img.shields.io/badge/Architecture-Static%20SPA-4f46e5" />
  </p>
</div>

<p align="center">
  <a href="https://ceskasc.github.io/appanvil/">Live Site</a>
  ·
  <a href="#why-appanvil">Why AppAnvil</a>
  ·
  <a href="#feature-set">Feature Set</a>
  ·
  <a href="#run-locally">Run Locally</a>
</p>

<p align="center">
  <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80" alt="AppAnvil visual" width="920" />
</p>

## Why AppAnvil

AppAnvil is a GitHub Pages friendly installer profile platform inspired by the simplicity of Ninite.

It is intentionally safe in-browser:
- It helps you pick apps quickly.
- It creates install profiles and script outputs.
- It does not auto-run installers in the browser.

The native custom EXE installer flow is planned as the next major delivery.

## Feature Set

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Catalog and Selection</h3>
      <ul>
        <li>147 curated applications across major categories</li>
        <li>Provider mappings: Winget, Chocolatey, Scoop</li>
        <li>Fuzzy search, category/provider filters, sorting</li>
        <li>Selection cart with local persistence</li>
        <li>Command palette (<code>Ctrl/Cmd + K</code>)</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Profile and Sharing</h3>
      <ul>
        <li>Hash-based routing for GitHub Pages</li>
        <li>Share tokens with LZ-string compression</li>
        <li>Validated imports via token/URL/JSON</li>
        <li>Zod-backed schema validation</li>
        <li>Accessible keyboard-first interactions</li>
      </ul>
    </td>
  </tr>
</table>

## Current Product State

- Theme: light-first product interface.
- Download launcher actions: intentionally paused in UI while native installer architecture is finalized.
- Safety copy is visible in-product to prevent blind execution.

## Tech Stack

- Vite (vanilla) + TypeScript
- Tailwind CSS
- Fuse.js (fuzzy search)
- LZ-String (share token compression)
- Zod (schema validation)
- Vitest (unit tests)

## Routes

App uses hash routing and works safely on refresh in GitHub Pages:

- `#/` catalog and selection
- `#/generate` output workspace
- `#/share/<token>` import by share token

## Run Locally

```bash
npm install
npm run dev
```

Build and tests:

```bash
npm test
npm run build
```

## Deploy to GitHub Pages

1. Push repository to `appanvil`.
2. Open `Settings -> Pages`.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`.
5. Workflow in `.github/workflows/deploy.yml` runs tests, build, and deploy.

Expected URL:

`https://<username>.github.io/appanvil/`

## Product Positioning

AppAnvil targets teams and individuals who want repeatable workstation setup with a clean UX and transparent install mapping. The goal is to evolve from profile/script generation into a polished native one-click installer product.

## License

Internal / project-specific. Add your preferred license before distribution.
