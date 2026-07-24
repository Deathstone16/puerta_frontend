# Design Document

## Tailwind dark: replacement pattern

Every file replaces hardcoded dark-only classes:

| Before (dark-only) | After (light-first + dark:) |
|---|---|
| `bg-void` | `bg-white dark:bg-void` |
| `bg-floor` | `bg-gray-50 dark:bg-floor` |
| `text-paper-text` | `text-gray-900 dark:text-paper-text` |
| `text-muted` | `text-gray-500 dark:text-muted` |
| `text-white` (on dark bg) | `text-gray-900 dark:text-white` |
| `border-white/10` | `border-gray-200 dark:border-white/10` |
| `border-white/15` | `border-gray-200 dark:border-white/15` |
| `border-white/20` | `border-gray-300 dark:border-white/20` |
| `bg-white/5` | `bg-gray-100 dark:bg-white/5` |
| `bg-void/80` | `bg-white/80 dark:bg-void/80` |
| `bg-void/90` | `bg-white/90 dark:bg-void/90` |
| `bg-void/95` | `bg-white/95 dark:bg-void/95` |
| `bg-black` | `bg-gray-100 dark:bg-black` |
| `bg-club-grid` | keep only in `dark:bg-club-grid` |

## RrppListaPage

```
/rrpp/lista/:eventoId

┌─────────────────────────────────────────────────────┐
│ Header: ← Volver | EVENTO NAME | 12/220 anotados   │
├─────────────────────────┬───────────────────────────┤
│ MI LISTA (aprobados)    │ PENDIENTES               │
│                         │                           │
│ [Agregar manualmente]   │ Solicitud 1 [✓] [✗]     │
│                         │ Solicitud 2 [✓] [✗]     │
│ Guest 1 [✏️] [🗑️]      │                           │
│ Guest 2 [✏️] [🗑️]      │                           │
│ Guest 3 [✏️] [🗑️]      │                           │
└─────────────────────────┴───────────────────────────┘

Mobile: panels stack vertically (lista first, pendientes below)
```

## API endpoints used by RrppListaPage

- `GET /api/rrpp/mi-panel/` → filter by eventoId for guest data
- `POST /api/rrpp/anotar-invitado/` → add manual guest
- `POST /api/rrpp/aprobar-invitado/:id/` → approve pending
- `POST /api/rrpp/rechazar-invitado/:id/` → reject (remove)
- `POST /api/rrpp/eliminar-invitado/:id/` → delete from list
