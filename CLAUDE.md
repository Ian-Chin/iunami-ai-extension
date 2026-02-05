# Iunami - Chrome Extension

## Project Overview

Chrome Extension (Manifest V3) that connects users to their Notion workspace via a side panel. Users can manually enter structured data that gets pushed directly into a Notion database as a new page.

Multi-workspace support lets users connect multiple Notion pages, each with auto-detected child and linked databases.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.9, JavaScript (service worker) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Build | Vite 7 with SWC, PostCSS, Autoprefixer |
| Icons | Lucide React |
| Notion | Notion REST API v2022-06-28 (proxied through service worker) |
| Extension | Chrome Manifest V3 - Side Panel, Storage, Runtime messaging |
| Lint | ESLint 9 with typescript-eslint, react-hooks, react-refresh plugins |

## Project Structure

```
iunami-extension/
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component, view routing
│   ├── index.css                 # Tailwind imports
│   ├── components/
│   │   ├── Dashboard.tsx         # Workspace list, Manual Entry
│   │   ├── Settings.tsx          # Token input, page connection, DB scanning
│   │   └── More.tsx              # Info links and about panel
│   └── assets/
├── service-worker.js             # Chrome background script, Notion API proxy
├── public/
│   └── manifest.json             # Chrome extension manifest
├── index.html                    # HTML shell
├── vite.config.ts                # Vite build config (dual entry: UI + service worker)
├── tsconfig.json                 # Root TS config
├── tsconfig.app.json             # App TS config (strict, ES2022)
├── postcss.config.js             # Tailwind + Autoprefixer
└── eslint.config.js              # ESLint config
```

## Key Files

- **`service-worker.js`** - Proxies all Notion API calls from the React UI. Handles `NOTION_API_CALL` messages, attaches auth headers, returns `{ success, data/error }`. Also configures side panel behavior.
- **`src/components/Dashboard.tsx`** - Contains `Dashboard` (workspace list) and `DashboardItem` (expandable card with refresh, delete, Manual Entry).
- **`src/components/Settings.tsx`** - Workspace setup. Recursive database scanner `scanForDatabases` at line 17. Input validation with regex at line 61. Atomic storage write at line 119.
- **`src/App.tsx`** - View routing via `useState` (`dashboard` | `settings` | `more`). Token check on mount at line 11.

## Build & Dev Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript compile + Vite build -> dist/
npm run lint      # ESLint check
npm run preview   # Preview production build
```

### Loading in Chrome

1. `npm run build`
2. Navigate to `chrome://extensions/`, enable Developer Mode
3. "Load unpacked" and select the `dist/` directory

### Build Config Notes

- Vite uses `base: './'` for correct asset paths in the extension context (`vite.config.ts:6`)
- Two entry points: `index.html` (UI) and `service-worker.js` (background) (`vite.config.ts:10-13`)
- Output filenames strip hashes for stable references (`vite.config.ts:14-19`)
- The manifest references `background.js` (the built output name for `service-worker.js`)

## Extension Architecture

```
[React Side Panel UI]
        |
        | chrome.runtime.sendMessage({ type: 'NOTION_API_CALL', ... })
        v
[Service Worker (background.js)]
        |
        | fetch() with Bearer token + Notion-Version header
        v
[Notion REST API]
```

## Chrome Storage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `notionToken` | `string` | User's Notion integration token |
| `allDashboards` | `any[]` | Array of workspace objects `{ id, name, icon, databases[] }` |

## Additional Documentation

Check these files for deeper context when working in specific areas:

- **[Architectural Patterns](.claude/docs/architectural_patterns.md)** - Chrome messaging protocol, state management, and component conventions used throughout the codebase
