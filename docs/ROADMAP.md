# AppAnvil Roadmap

## Completed

### Phase 0
- Set up Vite + TypeScript + Tailwind with `index.html` entry.
- Built responsive shell layout and hash router foundation.
- Added dark/light theme with `<html class="dark">` strategy and persistence.

### Phase 1
- Added validated catalog loading from `public/data/apps.json` (60+ apps).
- Implemented fuzzy search, category/provider/popular filters, sorting.
- Built cart UX (desktop sticky + mobile drawer) with persistence.
- Added keyboard command palette (`Ctrl/Cmd + K`).

### Phase 2
- Implemented pure script generator for PowerShell/Winget/Choco/Scoop/JSON.
- Added generate page tabs, option toggles, copy/download actions.
- Added logging/admin/winget checks and summary in generated PowerShell script.

### Phase 3
- Added share token encode/decode with `lz-string` + Zod validation.
- Implemented `#/share/:token` auto-load behavior and graceful invalid token handling.
- Added import flows (paste token/URL, upload JSON).
- Added Vitest coverage for generator and share token behavior.
- Added GitHub Actions workflow for Pages deployment.

## Next
- Add lightweight analytics for anonymous feature usage (optional).
- Add catalog update tooling and periodic mapping verification pipeline.
- Add localization support (TR/EN) for UI copy.
