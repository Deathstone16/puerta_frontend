# Implementation Plan: Admin Norware Panel

## Overview

Replace the `DeferredRolePage` placeholder at `/admin` with a functional `AdminPage` component. The implementation creates mock data, builds the page component with a custom data-fetching hook, wires it into the router, and sets up unit tests.

## Tasks

- [ ] 1. Create admin mock data module
  - Create `src/data/adminMockData.js` with realistic sample data matching the `AdminMetricsResponse` shape
  - Include `totales` object with `entradas_web_total`, `comision_norware_total`, `eventos_activos`, `eventos_cancelados`
  - Include `por_evento` array with 4-5 sample events covering both "publicado" and "cancelado" states
  - Export as named export `adminMockData`
  - _Requirements: 4.3_

- [ ] 2. Implement AdminPage component
  - [ ] 2.1 Create `src/pages/AdminPage.jsx` with the base layout structure
    - Self-contained layout with `min-h-screen bg-void bg-club-grid` wrapper
    - Admin header with "ADMIN NORWARE" branding (font-display) and logout button
    - Logout button uses the `useAuth()` hook's `logout` function
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 2.2 Implement `useAdminMetrics` custom hook inside AdminPage
    - Fetch from `/admin/metricas/` using `api.get()`
    - On success, store response in state
    - On failure, fall back to `adminMockData`
    - Track loading state, expose `{ data, loading }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 2.3 Implement KPI cards grid
    - Render 4 KPI cards from `data.totales`
    - Labels: "Entradas Web Total", "Comisión Norware Total", "Eventos Activos", "Eventos Cancelados"
    - Use `formatMoney` from `src/data/mockData.js` for monetary values
    - Apply font-mono to money values
    - Responsive grid: 1 col mobile, 2 col sm, 4 col lg
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2_

  - [ ] 2.4 Implement events table
    - Render a table with columns: Evento, Boliche, Fecha, Estado, Entradas Web, Comisión Norware, Recaudado Total Web
    - Estado badge: "publicado" in `text-strobe bg-strobe/10`, "cancelado" in `text-door-red bg-door-red/10`
    - Money columns use `formatMoney` with font-mono
    - Wrap table in `overflow-x-auto` container for mobile scroll
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.3_

  - [ ] 2.5 Implement loading state
    - Show a loading indicator while `useAdminMetrics` is fetching
    - Use void background and centered spinner or pulsing skeleton
    - _Requirements: 4.4_

- [ ] 3. Wire AdminPage into the router
  - In `src/App.jsx`, replace `DeferredRolePage` with `AdminPage` for the `/admin` route
  - Add `import AdminPage from './pages/AdminPage'`
  - Remove the `DeferredRolePage` import if no longer used elsewhere
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [ ] 4. Checkpoint
  - Ensure the app builds without errors (`npm run build`)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Write unit tests for AdminPage
  - [ ]* 5.1 Write unit tests for AdminPage (`src/pages/AdminPage.test.jsx`)
    - Test: renders 4 KPI cards with correct values from API data
    - Test: renders events table with correct column headers and row data
    - Test: "publicado" badge uses strobe styling, "cancelado" uses door-red styling
    - Test: shows loading state while data is being fetched
    - Test: falls back to mock data when API request fails
    - Test: logout button triggers auth context logout
    - Test: monetary values display with font-mono class
    - Test: table container has overflow-x-auto for responsive scroll
    - _Requirements: 1.2, 1.3, 2.1, 2.6, 3.1, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3, 4.4_

- [ ] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The existing `ProtectedRoute` already handles access control for `superadmin` role — no changes needed there
- `formatMoney` from `src/data/mockData.js` is reused for currency formatting (no new utility needed)
- The `DeferredRolePage` component file can be kept or deleted — it may be used for other deferred routes in the future
- Testing infrastructure (Vitest + RTL) is assumed to be set up by the `testing-infrastructure` spec before this executes
