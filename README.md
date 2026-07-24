# Norware Frontend

SPA web para publicar eventos nocturnos, vender entradas y operar acceso, caja y listas RRPP. El código actual es un frontend React/Vite: **este workspace no incluye backend**. Puede integrarse con una API REST o mostrar datos/fallbacks demo según el módulo y el tipo de error.

La referencia exhaustiva de arquitectura, contratos, mocks, pruebas y mantenimiento está en [`docs/GUIA_TECNICA.md`](docs/GUIA_TECNICA.md).

## Estado actual

| Módulo | Estado real |
|---|---|
| Cartelera y detalle público | Implementado; consulta API y conserva mocks si falla |
| Lista pública | Implementada; un fallo de red puede mostrar éxito sin persistencia |
| Checkout | Integración iniciada con API/Mercado Pago; sólo un fallo clasificado como red (`status === 0`) al iniciar el pago usa `demo-ticket` |
| Wallet | Integración parcial; muestra un ticket fallback desde la carga, lo conserva ante cualquier fallo del GET y puede mostrar confirmación falsa porque no consume `estado` |
| Autenticación y roles | Implementada; JWT/refresh para API y credenciales demo sólo si no hay conexión. `/auth/refresh/` pasa por el mismo interceptor y un `401` propio puede causar recursión antes del logout |
| Guardia | Implementada; QR/DNI, aprobar/rebotar y aforo. Tiene un fallback de red riesgoso documentado en la guía |
| Caja | Implementada, sin tabs; QR web, DNI de lista sólo demo, cobro, venta general y deshacer |
| RRPP | Implementado; eventos, métricas, link, alta de invitados y polling |
| Dueño | Parcial: métricas en vivo; acciones rápidas son placeholders |
| Superadmin | Diferido: sólo pantalla de “próxima etapa” |
| Pulseras | Eliminadas del alcance; no hay interfaz ni flujo de pulseras |

## Stack y versiones

- React `18.3.1`, React DOM `18.3.1`
- React Router DOM `6.30.1`
- Vite `5.4.19` y `@vitejs/plugin-react` `4.4.1`
- Tailwind CSS `3.4.17`, PostCSS `8.5.3`, Autoprefixer `10.4.21`
- `html5-qrcode` `2.3.8` para cámara/lectura QR
- `qrcode.react` `4.2.0` para generar el QR de la entrada

No hay TypeScript, tests, lint, typecheck ni CI configurados.

## Requisitos

- Node.js y npm. El proyecto no fija una versión de Node mediante `engines`.
- Navegador moderno.
- Para cámara: `localhost` o HTTPS y permiso del navegador.
- Backend compatible, sólo si se quiere probar la integración real.

## Instalación

### Windows PowerShell

```powershell
Set-Location "C:\Users\twitc\Desktop\ticketera"
Copy-Item .env.example .env
npm install
npm run dev
```

Si PowerShell bloquea `npm.ps1` por `ExecutionPolicy`, use los ejecutables `.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

### Linux/macOS u otra terminal

```bash
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5173`. El puerto está fijado en `vite.config.js`.

## Variables de entorno

```dotenv
VITE_API_URL=http://localhost:8000/api
```

`VITE_API_URL` debe apuntar a la base que **ya incluye `/api`**. El cliente concatena rutas como `/auth/login/`; no configure `.../api/api`. Si no existe `.env`, usa `http://localhost:8000/api`. Las variables `VITE_*` quedan expuestas al bundle: no coloque secretos.

## Scripts

| Comando | Función |
|---|---|
| `npm run dev` | Servidor Vite de desarrollo |
| `npm run build` | Genera producción en `dist/` |
| `npm run preview` | Sirve localmente el build generado |

No existen scripts de test, lint o typecheck.

## Cómo acceder

- Flujo público: `http://localhost:5173/`
- Login de equipo: `http://localhost:5173/login`
- En desarrollo sin API, use una credencial demo. El modo demo de login sólo se activa si la petición falla por red (`status 0`), no ante un `401` o credenciales rechazadas por un backend activo.

## Rutas completas

| Ruta | Pantalla | Acceso/estado |
|---|---|---|
| `/` | Cartelera | Pública, implementada |
| `/evento/:id` | Detalle de evento | Pública; acepta id o slug en mocks |
| `/checkout/:id` | Checkout | Pública; integración parcial |
| `/procesando` | Procesando pago | Pública; temporizador de 3 s, no webhook |
| `/wallet/:token` | Entrada/QR | Pública; API o fallback local |
| `/lista/:slug` | Alta en lista RRPP | Pública, implementada con fallback optimista de red |
| `/login` | Login | Pública |
| `/dashboard` | Dashboard Dueño | Auth, rol `dueno`, layout `OwnerShell`; parcial |
| `/dueno` | Redirección | Redirige a `/dashboard` |
| `/rrpp` | Panel RRPP | Auth, rol `rrpp`; implementado |
| `/guardia` | Terminal Guardia | Auth, rol `guardia`; implementado |
| `/cajera` | Terminal Caja | Auth, rol `cajera`; implementado sin tabs |
| `/admin` | Superadmin | Auth, rol `superadmin`; diferido |
| Cualquier otra | 404 | Pública |

## Usuarios demo

Son credenciales de desarrollo, visibles en el JavaScript entregado al navegador; no deben usarse en producción.

| Usuario | Contraseña | Rol | Destino |
|---|---|---|---|
| `carlos_dueno` | `dueno123` | Dueño | `/dashboard` |
| `juan_rrpp` | `rrpp123` | RRPP | `/rrpp` |
| `maria_guardia` | `guardia123` | Guardia | `/guardia` |
| `ana_cajera` | `cajera123` | Cajera | `/cajera` |
| `admin` | `admin123` | Superadmin | `/admin` |

## Datos rápidos para probar

### Guardia

| Persona | DNI | QR | Estado inicial |
|---|---:|---|---|
| Martina Ríos | `40111222` | `NORWARE-DEMO-101` | pendiente |
| Tomás Vega | `38987654` | `NORWARE-DEMO-102` | pendiente |
| Lucía Ferreyra | `42555111` | `NORWARE-DEMO-103` | ingresado |

> Riesgo actual: ante error de red Guardia usa fallback sin comprobar `session.isDemo`; además, cualquier QR desconocido puede convertirse en el asistente demo con id `900`. No interprete ese resultado como validación real.

### Caja

- QR web válido local: `NORWARE-WEB-201` (Martina Ríos).
- DNI de lista: `38987654` (Tomás Vega, $5.500) o `42555111` (Lucía Ferreyra, $5.500).
- Venta general: 1 a 6 personas, DNI de 7 u 8 dígitos, efectivo o transferencia.
- Deshacer: disponible durante 10 minutos si la operación devuelve un id.

Caja identifica QR contra datos locales incluso con sesión real. La búsqueda por DNI no tiene endpoint y se habilita sólo en sesión demo.

### RRPP

- El usuario demo recibe `Neon Protocol` (168/220) y `After Hours` (87/140).
- DNI ya existentes útiles: `42148376`, `39876541`, `44012387`, `41222444`, `43555666`.
- Para probar un alta exitosa use un DNI nuevo de 7 u 8 dígitos.

## Backend y modo demo

No hay servidor backend en este workspace. El cliente intenta primero `VITE_API_URL`. Los fallbacks no son uniformes:

- login demo: sólo error de red y credenciales exactas;
- cartelera/detalle/dashboard/listas públicas: conservan mocks o simulan éxito en algunos errores;
- RRPP y Caja operativa: fallback transaccional sólo con sesión demo y error de red;
- Guardia: fallback por error de red incluso sin sesión demo (**riesgo**);
- checkout: un error de red crea el token local `demo-ticket`;
- wallet: inicia con un ticket fallback y lo conserva ante cualquier fallo del GET (incluidos `401`, `404`, `500`, red o parsing). Los rótulos “Pago confirmado” y “Acceso confirmado” están hardcodeados y no consumen `estado`, por lo que el fallback puede mostrar una confirmación falsa.

Dos riesgos transversales del cliente HTTP: `/auth/refresh/` pasa por el mismo interceptor de `401` que intenta refrescar, de modo que un `401` del propio refresh puede recursar antes del `catch`/logout; debe excluirse del interceptor. Además, el JSON se parsea antes de comprobar `response.ok`: un cuerpo vacío o inválido declarado `application/json` genera un error nativo sin `status`/`data`, no un `ApiError` completo.

Los mocks son sólo para desarrollo, no persisten tras recargar y están visibles en el bundle.

## Build y despliegue

```bash
npm run build
npm run preview
```

Publique el contenido de `dist/`. Como se usa `BrowserRouter`, el hosting debe reescribir rutas desconocidas a `/index.html`; de lo contrario, abrir `/guardia`, `/wallet/...`, etc. directamente dará 404 del servidor. El build existente contiene un chunk grande asociado al escáner QR (>500 kB), por lo que conviene revisar partición/carga diferida antes de producción.


