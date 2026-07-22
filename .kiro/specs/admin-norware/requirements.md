# Requirements Document

## Introduction

The Admin Norware panel replaces the current `DeferredRolePage` placeholder at the `/admin` route with a functional superadmin dashboard. This panel provides platform-level metrics including total online ticket sales, Norware commissions, active/cancelled event counts, and a per-event breakdown table. It is accessible only to users with the `superadmin` role and follows the existing nightclub design system (void/floor/uv/strobe/door-red).

## Glossary

- **Admin_Panel**: The page component rendered at `/admin` that displays platform-level KPIs and an events table for the Norware superadmin.
- **KPI_Card**: A summary card widget displaying a single key performance indicator (label, value, and optional description).
- **Events_Table**: A table component showing per-event metrics with columns for name, venue, date, status, ticket count, commission, and total revenue.
- **Metrics_API**: The backend endpoint `GET /api/admin/metricas/` that returns platform totals and per-event breakdown data.
- **Mock_Data**: A static fallback dataset used when the Metrics_API is unreachable.
- **Superadmin**: A user with the role `superadmin` who has exclusive access to the Admin_Panel.
- **Estado_Badge**: A colored status indicator showing event state — "publicado" in strobe color or "cancelado" in door-red color.

## Requirements

### Requirement 1: Admin Panel Layout and Branding

**User Story:** As a superadmin, I want to see a branded admin panel with a clear header, so that I can identify the platform management interface.

#### Acceptance Criteria

1. WHEN a superadmin navigates to `/admin`, THE Admin_Panel SHALL render a self-contained layout with its own header (not wrapped in OwnerShell).
2. THE Admin_Panel header SHALL display the text "ADMIN NORWARE" as branding and a logout button.
3. WHEN the superadmin clicks the logout button, THE Admin_Panel SHALL terminate the session and redirect to the login page.
4. THE Admin_Panel SHALL use the project design system colors (void background, floor panels, uv/strobe/door-red accents, paper-text for readable text).

### Requirement 2: KPI Cards Display

**User Story:** As a superadmin, I want to see key platform metrics at a glance, so that I can monitor overall business performance.

#### Acceptance Criteria

1. WHEN the Admin_Panel loads successfully, THE Admin_Panel SHALL display exactly 4 KPI_Card components.
2. THE first KPI_Card SHALL display the `entradas_web_total` value with the label "Entradas Web Total".
3. THE second KPI_Card SHALL display the `comision_norware_total` value with the label "Comisión Norware Total".
4. THE third KPI_Card SHALL display the `eventos_activos` value with the label "Eventos Activos".
5. THE fourth KPI_Card SHALL display the `eventos_cancelados` value with the label "Eventos Cancelados".
6. WHEN a KPI_Card displays a monetary value, THE KPI_Card SHALL format the value as Argentine pesos using font-mono typography.

### Requirement 3: Events Table Display

**User Story:** As a superadmin, I want to see a per-event breakdown of metrics, so that I can analyze individual event performance.

#### Acceptance Criteria

1. WHEN the Admin_Panel loads successfully, THE Events_Table SHALL display one row per event from the `por_evento` array.
2. THE Events_Table SHALL display columns: Evento (name), Boliche (venue), Fecha (date), Estado (status badge), Entradas Web (count), Comisión Norware (money), and Recaudado Total Web (money).
3. WHEN an event has estado "publicado", THE Estado_Badge SHALL render in strobe color.
4. WHEN an event has estado "cancelado", THE Estado_Badge SHALL render in door-red color.
5. WHEN monetary columns are displayed, THE Events_Table SHALL format values as Argentine pesos using font-mono typography.
6. WHILE the viewport width is smaller than the table width, THE Events_Table SHALL scroll horizontally to remain usable on mobile devices.

### Requirement 4: Data Fetching and Fallback

**User Story:** As a superadmin, I want the panel to load real data from the API and fall back to mock data when unavailable, so that the interface remains functional during development and outages.

#### Acceptance Criteria

1. WHEN the Admin_Panel mounts, THE Admin_Panel SHALL send a GET request to `/api/admin/metricas/`.
2. WHEN the Metrics_API responds successfully, THE Admin_Panel SHALL populate KPI_Cards and Events_Table with the response data.
3. IF the Metrics_API request fails (network error or non-2xx status), THEN THE Admin_Panel SHALL display Mock_Data so the interface remains functional.
4. WHILE the Admin_Panel is waiting for the Metrics_API response, THE Admin_Panel SHALL display a loading state to indicate data is being fetched.

### Requirement 5: Access Control

**User Story:** As a platform operator, I want only superadmin users to access the admin panel, so that sensitive business metrics are protected.

#### Acceptance Criteria

1. WHEN a non-authenticated user navigates to `/admin`, THE ProtectedRoute SHALL redirect to the login page.
2. WHEN an authenticated user without the `superadmin` role navigates to `/admin`, THE ProtectedRoute SHALL redirect to that user's role-appropriate route.
3. WHEN a user with role `superadmin` navigates to `/admin`, THE ProtectedRoute SHALL allow access and render the Admin_Panel.

### Requirement 6: Responsive Design

**User Story:** As a superadmin, I want the admin panel to be usable on both desktop and mobile, so that I can check metrics from any device.

#### Acceptance Criteria

1. WHILE the viewport is at desktop width (≥768px), THE Admin_Panel SHALL display KPI_Cards in a horizontal grid layout.
2. WHILE the viewport is at mobile width (<768px), THE Admin_Panel SHALL stack KPI_Cards vertically.
3. WHILE the viewport is narrower than the Events_Table content, THE Events_Table container SHALL enable horizontal scrolling.
