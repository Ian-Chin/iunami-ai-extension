# Architectural Patterns

## 1. Chrome Runtime Message Passing (API Proxy)

All Notion API calls are routed through the Chrome service worker via `chrome.runtime.sendMessage`. Components never call the Notion API directly.

**Request shape** (used identically in all call sites):
```
{ type: 'NOTION_API_CALL', endpoint: string, method: string, token: string, body?: object }
```

**Response shape** (returned by service worker):
```
{ success: boolean, data?: any, error?: string }
```

**Call sites:**
- `src/components/Dashboard.tsx:74` - GET page data
- `src/components/Dashboard.tsx:75` - GET block children
- `src/components/Dashboard.tsx:157` - GET database schema
- `src/components/Dashboard.tsx:187` - POST create page
- `src/components/Settings.tsx:18` - GET block children (recursive scanner)
- `src/components/Settings.tsx:82` - GET page metadata

**Handler:** `service-worker.js:6-32` - Listens for `NOTION_API_CALL`, performs `fetch()` with auth headers, returns result. Returns `true` at line 31 to keep the async channel open.

**Convention:** When adding new Notion API interactions, always route through the service worker using this message shape. Direct `fetch()` to Notion from the UI will fail due to CORS restrictions.

## 2. Chrome Storage as Persistence Layer

All persistent state uses `chrome.storage.local` with two keys: `notionToken` and `allDashboards`. There is no separate caching layer.

**Read pattern** (fetch-on-mount):
- `src/App.tsx:12` - Check token existence on app load
- `src/components/Dashboard.tsx:26` - Load dashboards on mount
- `src/components/Settings.tsx:11` - Load existing token on mount

**Write pattern** (read-then-update):
- `src/components/Dashboard.tsx:84` - Update single dashboard in array, write full array back
- `src/components/Dashboard.tsx:36` - Filter out removed dashboard, write back
- `src/components/Settings.tsx:119-122` - Atomic write of both token and dashboards

**Convention:** Always read current state before mutating. Write the entire array back after modification. After writes, trigger a reload via callback (`onUpdateComplete` or `loadData`).

## 3. State Management: useState + Callbacks

No external state management library. State is managed with React `useState` hooks, and child-to-parent communication uses callback props.

**View routing** in `App.tsx:8`: `useState('dashboard')` with values `'dashboard' | 'settings' | 'more'`

**Callback prop pattern** (used by all components):
- `Settings` receives `onComplete` (`App.tsx:52`, called at `Settings.tsx:126`)
- `Dashboard` receives `onAddClick` (`App.tsx:60`)
- `DashboardItem` receives `onRemove` and `onUpdateComplete` (`Dashboard.tsx:53-55`)

**Loading state pattern** (repeated in every component):
- `Dashboard.tsx` - `isUpdating` for refresh, `loadingStep` for manual entry operations
- `Settings.tsx:7` - `isLoading` for workspace sync

All loading states render `<Loader2 className="animate-spin" />` from lucide-react.

## 4. Status Feedback Objects

User-facing operation feedback follows a typed status object pattern.

**Implementation:** `src/components/Settings.tsx:8`
```
{ type: 'idle' | 'error' | 'success', msg: string }
```

Status is set at key points:
- Validation failure: `Settings.tsx:63` (error)
- Duplicate check: `Settings.tsx:76` (error)
- API failure: `Settings.tsx:90` (error)
- Success: `Settings.tsx:124` (success with count)

Rendered with conditional styling at `Settings.tsx:172`: green bg for success, red bg for error.

**Convention for new operations:** Use `{ type, msg }` status objects for any user-facing multi-step operation that can fail.

## 5. Recursive Block Scanning

Notion pages can contain nested structures (columns, callouts, toggles). The database scanner handles this with recursive traversal.

**Implementation:** `src/components/Settings.tsx:17-56` (`scanForDatabases`)

**Logic:**
1. Fetch children of a block via Notion API
2. For each child: if `child_database` -> collect; if `link_to_database` -> collect source ID; if `has_children` -> recurse
3. Deduplicate by ID using `Map` at `Settings.tsx:100`

**Convention:** Any future block-level scanning should follow this recursive pattern and always deduplicate results.

## 6. Notion Icon Rendering

A shared `NotionIcon` component (`Dashboard.tsx:8-16`) handles the three Notion icon types: `emoji`, `external` URL, and `file` URL. Falls back to a provided Lucide icon component.

**Used in:**
- Dashboard headers: `Dashboard.tsx:214` (with `LayoutDashboard` fallback)
- Database items: `Dashboard.tsx:239` (with `Database` fallback)

**Convention:** Always use `NotionIcon` when rendering Notion entity icons. Pass the appropriate Lucide icon as `fallback`.

## 7. Input Validation Pattern

User inputs are validated before API calls using regex extraction.

**Notion Page ID:** `Settings.tsx:61` - Extracts 32-character hex ID from any input (full URL or raw ID) using `/[a-f0-9]{32}/`.

**Duplicate check:** `Settings.tsx:75` - Checks existing dashboards array before adding.

**Convention:** Validate and normalize inputs before making API calls. Extract IDs from URLs rather than requiring specific input formats.

## 8. Component File Organization

Each component is a single file with a default export. Sub-components (like `DashboardItem`, `NotionIcon`) are defined in the same file as their parent and are not exported.

**Naming:**
- Components: PascalCase (`Dashboard`, `Settings`, `DashboardItem`)
- Event handlers: `handle{Action}` (`handleRemove`, `handleUpdate`, `handleManualSubmit`, `handleConnect`)
- State: camelCase descriptive (`isOpen`, `isLoading`, `activeDbId`)
- Chrome message types: SCREAMING_SNAKE_CASE (`NOTION_API_CALL`)
- Storage keys: camelCase (`notionToken`, `allDashboards`)
