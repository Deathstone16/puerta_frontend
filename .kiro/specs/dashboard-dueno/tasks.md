# Implementation Plan: Dashboard Dueño

## Overview

Replace the current placeholder DashboardPage with a fully-featured owner dashboard. Implementation follows an incremental approach: mock data and container first, then each tab/modal, building up to a complete integrated page. Each task produces a working increment.

## Tasks

- [ ] 1. Set up mock data and DashboardPage container with tab navigation
  - [ ] 1.1 Create `src/data/dashboardMockData.js` with mock boliche, eventos, aforo, recaudación, and ranking-rrpp data
    - Include `mockBoliche` with `{ id, nombre, mp_connected }`
    - Include `mockEventos` array with varied `estado`, prices
    - Include `mockAforo`, `mockRecaudacion`, `mockRankingRrpp` objects
    - _Requirements: 9.1_

  - [ ] 1.2 Rewrite `src/pages/DashboardPage.jsx` as container with tab navigation
    - Import and use `useAuth` for session context
    - Manage state: `activeTab` ('metricas' default), `boliche`, `eventos`, `modalState`
    - Fetch `GET /api/boliches/mio/` and `GET /api/eventos/` on mount, fallback to mock on status 0
    - Render header with aforo badge placeholder, "+ Nueva noche" button
    - Render 3-tab navigator (Métricas | Noches | Auditoría RRPP) using local state
    - Conditionally render tab placeholder content based on `activeTab`
    - Use design system classes: `bg-void`, `container-page`, `font-display`, `font-mono`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 10.1, 10.4_

  - [ ]* 1.3 Write unit tests for tab navigation behavior
    - Verify default tab is "Métricas"
    - Verify clicking each tab shows correct content
    - Verify URL does not change on tab switch
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement MetricasTab with Recharts
  - [ ] 2.1 Install `recharts` dependency
    - Run `npm install recharts`
    - _Requirements: 2.2, 2.3_

  - [ ] 2.2 Create `src/pages/dashboard/MetricasTab.jsx`
    - Accept `eventos` and `recaudacion` as props
    - Compute 4 KPIs: recaudación total, entradas vendidas, total de noches, promedio por noche
    - Render 4 KPI cards using `font-display` for values, `font-mono` for labels
    - Render `BarChart` (recaudación per noche) with `uv` (#8B5CF6) fill
    - Render `LineChart` (ventas last 7 days) with `uv` stroke
    - Use `useMemo` for KPI calculations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.2, 10.5_

  - [ ] 2.3 Wire MetricasTab into DashboardPage
    - Fetch recaudación data when Métricas tab is active
    - Pass computed data to MetricasTab
    - Handle API fallback to mock recaudación
    - _Requirements: 2.4, 2.5_

  - [ ]* 2.4 Write property test for KPI computation
    - **Property 1: KPI computation consistency**
    - For any set of recaudación values across N events, promedio = sum / N
    - **Validates: Requirement 2.1**

- [ ] 3. Implement NochesTab with event list and cancel action
  - [ ] 3.1 Create `src/pages/dashboard/NochesTab.jsx`
    - Accept `eventos`, `onEdit`, `onCancel`, `onCreate` props
    - Render event list with left border colored by estado: `uv` for "publicado", `door-red` for "cancelado"
    - Show nombre, fecha (formatted), estado badge, precio_publicado (formatted as ARS), aforo_max
    - Render "Editar" and "Cancelar" action buttons per event card
    - Render "Crear nueva noche" button that calls `onCreate`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

  - [ ] 3.2 Implement cancel flow in DashboardPage
    - Show confirmation prompt before cancellation
    - Call `POST /api/eventos/:id/cancelar/` with `{ motivo: 'Cancelado por dueño' }`
    - On success: update evento estado to 'cancelado' in local state
    - On status 405: show error message
    - _Requirements: 3.5, 3.6, 3.7_

  - [ ]* 3.3 Write unit test for estado border coloring
    - **Property 2: Estado border color mapping**
    - "publicado" events get uv border, "cancelado" events get door-red border
    - **Validates: Requirement 3.2**

- [ ] 4. Implement NocheFormModal (create and edit)
  - [ ] 4.1 Create `src/components/NocheFormModal.jsx`
    - Use existing `<Modal>` component as wrapper
    - Render form fields: nombre, fecha (datetime-local), aforo_max, precio_base, line_up (text, comma-separated)
    - Implement 500ms debounced price preview calling `GET /api/precios/calcular/?precio_base=X`
    - Display Price_Preview section showing fee_mp, fee_norware, precio_publicado
    - In create mode: `POST /api/eventos/crear/` with boliche_id (send color_pulsera as fixed value "amarilla")
    - In edit mode: `PATCH /api/eventos/:id/` with modified fields
    - Validate required fields on submit, highlight invalid
    - On success: close modal and call `onSuccess` to refresh list
    - On 405 error: show inline error message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 4.2 Wire NocheFormModal into DashboardPage
    - Open in create mode from "+ Nueva noche" button and NochesTab's "Crear nueva noche"
    - Open in edit mode from NochesTab's "Editar" button with pre-populated data
    - On success callback: re-fetch eventos
    - _Requirements: 3.4, 3.8, 4.6_

  - [ ]* 4.3 Write property test for debounce behavior
    - **Property 5: Debounce coalesces rapid changes**
    - For any N rapid precio_base changes within 500ms, API called at most once with final value
    - **Validates: Requirement 4.2**

  - [ ]* 4.4 Write property test for form validation
    - **Property 7: Form validation rejects incomplete submissions**
    - For any combination where at least one required field is empty, submission is prevented
    - **Validates: Requirements 4.5, 6.3**

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement RrppFormModal and AsignarRrppModal
  - [ ] 6.1 Create `src/components/RrppFormModal.jsx`
    - Use `<Modal>` wrapper
    - Fields: nombre, apellido, username, password, telefono, tipo_comision (select: fija/porcentaje), valor_comision
    - Validate required fields, highlight invalid on submit
    - Call `POST /api/rrpp/` on valid submission
    - On success: close modal, show success notification (toast-style at bottom-right)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 6.2 Create `src/components/AsignarRrppModal.jsx`
    - Use `<Modal>` wrapper
    - Fetch `GET /api/rrpp/` for RRPP select and use `eventos` prop for event select
    - On submit: `POST /api/rrpp/:id/asignar-evento/` with `{ evento_id }`
    - On success: display returned links (tipo + url) in a list
    - On error: display error message from API response
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 6.3 Add RRPP action buttons to Auditoría tab header
    - "Alta RRPP" button opens RrppFormModal
    - "Asignar RRPP" button opens AsignarRrppModal
    - Wire modal state through DashboardPage
    - _Requirements: 6.1, 7.1_

- [ ] 7. Implement AuditoriaRrppTab
  - [ ] 7.1 Create `src/pages/dashboard/AuditoriaRrppTab.jsx`
    - Accept `eventoId` prop
    - Fetch `GET /api/dashboard/ranking-rrpp/:evento_id/` on mount and when eventoId changes
    - Fall back to mock ranking on status 0
    - Sort data by `recaudado_total` descending
    - Render table with columns: nombre, anotados, ingresados, tasa_conversion (%), recaudado_total
    - Apply `getConversionColor(tasa)` for tasa_conversion cell coloring
    - Show empty state message when no data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property test for conversion color thresholds
    - **Property 3: Conversion color thresholds**
    - For any tasa_conversion 0–100: green ≥ 70, yellow [40,70), red < 40
    - **Validates: Requirement 5.3**

  - [ ]* 7.3 Write property test for sort order
    - **Property 4: RRPP ranking sort order**
    - For any RRPP array, displayed order is descending by recaudado_total
    - **Validates: Requirement 5.4**

- [ ] 8. Implement MercadoPagoConnect and aforo polling
  - [ ] 8.1 Create `src/components/MercadoPagoConnect.jsx`
    - Accept `mpConnected` prop
    - If false: render "Conectar Mercado Pago" button with `btn-secondary` style
    - On click: call `GET /api/boliches/mp/connect/`, redirect to `auth_url`
    - If true: render "Conectado" badge with green indicator
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Implement aforo polling in DashboardPage header
    - Poll `GET /api/dashboard/aforo/:evento_id/` every 4 seconds
    - Display ingresados / aforo_max badge with live indicator
    - On poll failure: retain last data, continue polling
    - Render MercadoPagoConnect widget in header area
    - _Requirements: 9.3, 9.4, 10.3_

  - [ ]* 8.3 Write property test for polling resilience
    - **Property 6: Polling resilience preserves last data**
    - For any sequence of poll responses with failures, displayed data equals last success
    - **Validates: Requirement 9.4**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all tabs render correctly with mock data fallback
  - Verify all modals open/close correctly
  - Verify design system compliance (colors, fonts, patterns)

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The project does not currently have a test framework set up; test tasks should configure vitest if needed
- `recharts` is the only new dependency to install
- All components follow the existing patterns: `api.js` for requests, `Modal.jsx` for dialogs, Tailwind design tokens
- Pulseras are eliminated from scope: event cards use estado-based border colors (uv for publicado, door-red for cancelado)
- The backend still requires `color_pulsera` in POST /api/eventos/crear/ — send a fixed value ("amarilla") without exposing it to the user
