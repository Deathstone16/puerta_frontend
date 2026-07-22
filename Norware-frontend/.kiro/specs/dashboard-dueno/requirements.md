# Requirements Document

## Introduction

Replace the generic "Centro de Control" dashboard with a fully-featured owner dashboard for the Norware nightclub ticketing platform. The new dashboard provides three tabbed views — Métricas, Noches, and Auditoría RRPP — enabling nightclub owners to monitor KPIs, manage events (noches), and evaluate RRPP performance from a single page. It also includes modals for creating/editing events, managing RRPP staff, assigning RRPP to events, and connecting Mercado Pago for payment processing.

## Glossary

- **Dashboard**: The owner-facing tabbed control panel accessible at `/dashboard`
- **Owner**: A user with the `dueno` role who manages a nightclub (boliche)
- **Noche**: A scheduled nightclub event (synonymous with "evento" in the backend)
- **RRPP**: Public relations staff (Relaciones Públicas) who promote events and manage guest lists
- **Boliche**: The nightclub entity the owner manages
- **Aforo**: Venue capacity (maximum number of attendees)
- **Recaudación**: Total revenue collected from ticket sales
- **KPI_Card**: A display component showing a single key performance indicator
- **Metric_Chart**: A chart component (bar or line) rendered using Recharts
- **Tab_Navigator**: The component managing switching between the three dashboard tabs
- **Noche_Form_Modal**: The modal dialog for creating or editing a Noche
- **RRPP_Form_Modal**: The modal dialog for creating a new RRPP user
- **Asignar_RRPP_Modal**: The modal dialog for assigning an RRPP to an event
- **MP_Connect_Widget**: The component showing Mercado Pago connection status and initiating OAuth
- **Price_Preview**: The live price breakdown shown when editing precio_base in a form

## Requirements

### Requirement 1: Tab Navigation

**User Story:** As an owner, I want to switch between Métricas, Noches, and Auditoría RRPP views, so that I can access different aspects of my business from a single dashboard page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Tab_Navigator SHALL display three tabs labeled "Métricas", "Noches", and "Auditoría RRPP"
2. WHEN the Dashboard loads, THE Tab_Navigator SHALL select the "Métricas" tab by default
3. WHEN an owner clicks a tab, THE Tab_Navigator SHALL display the corresponding content panel and visually mark the selected tab as active
4. THE Tab_Navigator SHALL manage tab state using local component state without modifying the browser URL

### Requirement 2: Métricas Tab — KPIs and Charts

**User Story:** As an owner, I want to see key performance indicators and charts summarizing my events, so that I can understand my business performance at a glance.

#### Acceptance Criteria

1. WHEN the Métricas tab is active, THE Dashboard SHALL display four KPI_Card components showing: recaudación total, entradas vendidas, total de noches, and promedio de recaudación por noche
2. WHEN the Métricas tab is active, THE Dashboard SHALL render a bar chart showing recaudación per noche using Recharts
3. WHEN the Métricas tab is active, THE Dashboard SHALL render a line chart showing ventas over the last 7 days using Recharts
4. WHEN event data is fetched from `GET /api/eventos/` and revenue data from `GET /api/dashboard/recaudacion/:evento_id/`, THE Dashboard SHALL compute KPI values from the combined response data
5. IF the API request fails, THEN THE Dashboard SHALL display data from mock fallback values and continue rendering without errors

### Requirement 3: Noches Tab — Event List and Management

**User Story:** As an owner, I want to see all my events and manage them (create, edit, cancel), so that I can control my venue's schedule.

#### Acceptance Criteria

1. WHEN the Noches tab is active, THE Dashboard SHALL display a list of events fetched from `GET /api/eventos/`
2. WHEN displaying each event card, THE Dashboard SHALL render a left border colored by event estado: `uv` (#8B5CF6) for "publicado" and `door-red` (#E23B5A) for "cancelado"
3. WHEN displaying each event card, THE Dashboard SHALL show the event nombre, fecha, estado, precio_publicado, and aforo_max
4. WHEN an owner clicks the "Editar" action on an event card, THE Dashboard SHALL open the Noche_Form_Modal pre-populated with that event's data
5. WHEN an owner clicks the "Cancelar" action on an event card, THE Dashboard SHALL display a confirmation prompt before sending `POST /api/eventos/:id/cancelar/`
6. IF the cancellation API returns success, THEN THE Dashboard SHALL update the event's estado to "cancelado" in the list without requiring a full page reload
7. IF the cancellation API returns status 405, THEN THE Dashboard SHALL display an error message indicating the event cannot be cancelled
8. WHEN an owner clicks the "Crear nueva noche" button, THE Dashboard SHALL open an empty Noche_Form_Modal

### Requirement 4: Noche Form Modal (Create/Edit)

**User Story:** As an owner, I want to create and edit events through a form, so that I can manage my venue's event schedule.

#### Acceptance Criteria

1. THE Noche_Form_Modal SHALL contain fields for: nombre (text), fecha (datetime), aforo_max (number), precio_base (number), and line_up (text, comma-separated)
2. WHEN the owner modifies the precio_base field, THE Noche_Form_Modal SHALL call `GET /api/precios/calcular/?precio_base=X` with a 500ms debounce and display the resulting precio_publicado, fee_mp, and fee_norware as a Price_Preview
3. WHEN the form is submitted for a new event, THE Noche_Form_Modal SHALL send `POST /api/eventos/crear/` with the form data including boliche_id
4. WHEN the form is submitted for an existing event, THE Noche_Form_Modal SHALL send `PATCH /api/eventos/:id/` with the modified fields
5. IF any required field is empty on submission, THEN THE Noche_Form_Modal SHALL highlight the invalid fields and prevent submission
6. IF the API returns a successful response, THEN THE Noche_Form_Modal SHALL close and refresh the event list
7. IF the API returns status 405 on edit, THEN THE Noche_Form_Modal SHALL display an error message indicating the event cannot be modified

### Requirement 5: Auditoría RRPP Tab

**User Story:** As an owner, I want to see a ranked table of RRPP performance, so that I can evaluate their effectiveness and contribution.

#### Acceptance Criteria

1. WHEN the Auditoría RRPP tab is active, THE Dashboard SHALL display a table of RRPP fetched from `GET /api/dashboard/ranking-rrpp/:evento_id/`
2. WHEN rendering each RRPP row, THE Dashboard SHALL display: nombre, anotados, ingresados, tasa_conversion (percentage), and recaudado_total
3. WHEN rendering the tasa_conversion column, THE Dashboard SHALL apply green color for values above 70%, yellow for values between 40% and 70%, and red for values below 40%
4. THE Dashboard SHALL sort the RRPP table by recaudado_total in descending order (highest revenue first)
5. WHEN no RRPP data is available, THE Dashboard SHALL display an empty state message

### Requirement 6: Alta RRPP Modal

**User Story:** As an owner, I want to register new RRPP staff, so that I can expand my promotion team.

#### Acceptance Criteria

1. THE RRPP_Form_Modal SHALL contain fields for: nombre (text), apellido (text), username (text), password (password), telefono (text), tipo_comision (select: "fija" or "porcentaje"), and valor_comision (number)
2. WHEN the form is submitted with valid data, THE RRPP_Form_Modal SHALL send `POST /api/rrpp/` with the form data
3. IF any required field is empty on submission, THEN THE RRPP_Form_Modal SHALL highlight the invalid fields and prevent submission
4. IF the API returns a successful response, THEN THE RRPP_Form_Modal SHALL close and display a success notification

### Requirement 7: Asignar RRPP Modal

**User Story:** As an owner, I want to assign RRPP staff to specific events, so that they can promote those events and generate guest list links.

#### Acceptance Criteria

1. THE Asignar_RRPP_Modal SHALL contain a select for choosing an RRPP (fetched from `GET /api/rrpp/`) and a select for choosing an evento (fetched from `GET /api/eventos/`)
2. WHEN the form is submitted, THE Asignar_RRPP_Modal SHALL send `POST /api/rrpp/:id/asignar-evento/` with the selected evento_id
3. IF the API returns a successful response, THEN THE Asignar_RRPP_Modal SHALL display the generated links (tipo and url) returned in the response
4. IF the assignment fails, THEN THE Asignar_RRPP_Modal SHALL display the error message from the API response

### Requirement 8: Mercado Pago Connection

**User Story:** As an owner, I want to see my Mercado Pago connection status and connect if needed, so that I can receive online payments.

#### Acceptance Criteria

1. WHEN the boliche data from `GET /api/boliches/mio/` indicates mp_connected is false, THE MP_Connect_Widget SHALL display a "Conectar Mercado Pago" button
2. WHEN the owner clicks the "Conectar Mercado Pago" button, THE MP_Connect_Widget SHALL call `GET /api/boliches/mp/connect/` and redirect the user to the returned auth_url
3. WHEN the boliche data indicates mp_connected is true, THE MP_Connect_Widget SHALL display a "Conectado" status indicator

### Requirement 9: API Integration and Fallback

**User Story:** As an owner, I want the dashboard to work even when the backend is unreachable, so that I can still view the interface structure with sample data.

#### Acceptance Criteria

1. IF the API is unreachable (network error), THEN THE Dashboard SHALL fall back to displaying mock data from a local data file
2. THE Dashboard SHALL fetch boliche information from `GET /api/boliches/mio/` on mount to determine the owner's boliche context
3. WHEN fetching aforo data, THE Dashboard SHALL poll `GET /api/dashboard/aforo/:evento_id/` every 4 seconds to display live capacity
4. IF a polling request fails, THEN THE Dashboard SHALL retain the last successfully fetched data and continue polling

### Requirement 10: Design System Compliance

**User Story:** As an owner, I want the dashboard to match the overall visual identity of Norware, so that the experience is cohesive.

#### Acceptance Criteria

1. THE Dashboard SHALL use `bg-void` for backgrounds and `bg-floor` for surface panels
2. THE Dashboard SHALL use `uv` (#8B5CF6) color for primary actions and chart fills
3. THE Dashboard SHALL use `strobe` (#22D3EE) for live data indicators
4. THE Dashboard SHALL use `font-display` for headings, `font-mono` for data values, and `font-body` for paragraph text
5. THE Dashboard SHALL render charts with the `uv` color (#8B5CF6) as the primary data color
6. THE Dashboard SHALL use the existing `Modal` component pattern (border-2 border-strobe, shadow-[10px_10px_0_#8B5CF6]) for all modal dialogs
