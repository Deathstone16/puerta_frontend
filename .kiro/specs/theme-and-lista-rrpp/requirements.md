# Requirements Document

## Introduction

This spec covers three changes to the Norware frontend:

1. **Modo claro/oscuro completo** — Tailwind `dark:` variant en TODOS los archivos (~25). Light mode como default.
2. **Quitar instagram del formulario público** — El usuario que se anota a la lista no ingresa instagram.
3. **Página de gestión de lista RRPP** — `/rrpp/lista/:eventoId` con lista editable + pendientes lado a lado.

## Requirements

### Requirement 1: Paleta de colores Light Mode

**User Story:** As a user, I want the app to display in light mode by default.

#### Acceptance Criteria

1. WHEN no theme preference is stored, THE app SHALL render in light mode with: background `#FFFFFF`, surfaces `#F5F5F9`, text `#1A1A2E`, text-muted `#6B6B80`, borders `rgba(0,0,0,0.08)`.
2. WHEN dark mode is active (class `dark` on `<html>`), THE app SHALL use: background `#0A0A10`, surfaces `#141220`, text `#EDF8F5`, text-muted `#8A87A3`, borders `rgba(255,255,255,0.1)`.
3. Accent colors (uv, strobe, door-red) SHALL remain identical in both modes.
4. ALL pages and components SHALL use `dark:` variant classes instead of hardcoded dark values.

### Requirement 2: Theme Toggle en todos los layouts

#### Acceptance Criteria

1. THE Theme_Toggle SHALL appear in PublicLayout, OwnerShell, and AdminPage headers.
2. WHEN clicked, THE app SHALL switch modes immediately.
3. THE preference SHALL persist in localStorage.

### Requirement 3: Aplicación consistente en ~25 archivos

#### Acceptance Criteria

1. ALL pages SHALL use theme-aware classes.
2. ALL components SHALL use theme-aware classes.
3. NO white-on-white or dark-on-dark text artifacts.

### Requirement 4: Quitar instagram del formulario público

#### Acceptance Criteria

1. ListPage form SHALL NOT include instagram field.
2. EventDetailPage list modal SHALL NOT include instagram field.
3. POST payload to `/api/lista/:slug/anotar/` contains only: nombre, apellido, dni.

### Requirement 5: Página de gestión de lista RRPP

#### Acceptance Criteria

1. Route: `/rrpp/lista/:eventoId`, protected role `rrpp`.
2. Layout split: izquierda = "MI LISTA" (aprobados + manuales), derecha = "PENDIENTES".
3. Aprobar pendiente → pasa a lista con estado "aprobado".
4. Rechazar pendiente → se elimina (no queda en ningún lado).
5. Cada invitado en lista: botón editar (inline: nombre, apellido, DNI) + botón eliminar.
6. Botón "Agregar manualmente" → form inline que agrega directo a lista.
7. Header: nombre evento + fecha + contador anotados/cupo.
8. Link "Volver al panel" → `/rrpp`.
9. RrppPage event cards linkan a `/rrpp/lista/:eventoId` en vez de expandir inline.
10. Mobile: paneles apilados verticalmente (pendientes abajo de lista).

### Requirement 6: No horizontal scroll

#### Acceptance Criteria

1. `html` y `body` con `overflow-x: hidden`.
2. Ningún contenedor produce overflow horizontal en >= 320px.
