# Design Document: Testing Infrastructure

## Overview

This design establishes a complete testing infrastructure for the Norware Frontend project using Vitest as the test runner, React Testing Library for component interaction, and a custom render utility that wraps components in all application-level providers. The configuration reuses the existing Vite/React plugin setup to ensure module resolution parity between production builds and test execution.

## Architecture

```mermaid
graph TD
    A[vitest.config.js] --> B[Vite Plugin React]
    A --> C[jsdom Environment]
    A --> D[src/test/setup.js]
    D --> E[@testing-library/jest-dom]
    F[src/test/utils.jsx] --> G[BrowserRouter]
    F --> H[AuthProvider]
    F --> I[PurchaseProvider]
    F --> J[@testing-library/react]
    K[Test Files *.test.js] --> A
    K --> F
```

## Components and Interfaces

### Component 1: Vitest Configuration (`vitest.config.js`)

**Purpose**: Central test runner configuration that mirrors the Vite production setup and adds test-specific options.

```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/', 'src/test/', '**/*.test.*'],
    },
  },
})
```

**Responsibilities**:
- Provide jsdom as the simulated browser environment
- Register the setup file for global matcher extensions
- Enable `globals: true` so `describe`, `it`, `expect` are available without imports
- Configure v8 coverage provider with appropriate exclusions

### Component 2: Setup File (`src/test/setup.js`)

**Purpose**: Executed before each test file to extend the assertion library with DOM-specific matchers.

```javascript
import '@testing-library/jest-dom'
```

**Responsibilities**:
- Import jest-dom to add matchers like `toBeInTheDocument()`, `toHaveTextContent()`, `toBeVisible()`
- Run automatically via the `setupFiles` configuration

### Component 3: Custom Render Utility (`src/test/utils.jsx`)

**Purpose**: Provide a drop-in replacement for `@testing-library/react`'s `render` that includes all application context providers.

```jsx
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { PurchaseProvider } from '../context/PurchaseContext'

function AllProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PurchaseProvider>
          {children}
        </PurchaseProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

**Responsibilities**:
- Wrap components under test with BrowserRouter, AuthProvider, and PurchaseProvider
- Re-export all testing-library utilities so test files only need one import source
- Override the default `render` with the provider-wrapped version

### Component 4: Package Scripts

**Purpose**: Standard npm script interface for running tests.

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

**Responsibilities**:
- `test` — start Vitest in watch mode for development
- `test:run` — single execution for CI or quick validation
- `test:coverage` — single execution with v8 coverage reporting

## Data Models

### ApiError Class

```javascript
class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status   // HTTP status code (0 for network failures)
    this.data = data       // Parsed response body or null
  }
}
```

**Validation Rules**:
- `status` is a non-negative integer (0 for network errors, HTTP codes otherwise)
- `message` is always a non-empty string
- `data` can be any JSON-serializable value or null

### formatMoney Function

```javascript
const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
}).format(Number(value || 0))
```

**Validation Rules**:
- Input is coerced to Number (falsy values default to 0)
- Output uses Argentine peso format: `$` prefix, dot as thousands separator, no decimals
- Examples: `4500` → `"$4.500"`, `0` → `"$0"`, `1500000` → `"$1.500.000"`

## Error Handling

### Error Scenario 1: Network Failure in apiRequest

**Condition**: `fetch()` throws (network down, DNS failure, CORS preflight rejection)
**Response**: Wrap the native error in `ApiError` with `status: 0` and a user-facing message
**Recovery**: The calling component handles the error; demo-mode fallback in AuthContext catches status-0 errors for offline login

### Error Scenario 2: Test Setup Failure

**Condition**: Missing dependencies or incorrect setup file path
**Response**: Vitest exits with a clear error showing which import failed
**Recovery**: Developer installs missing packages or corrects the path in `vitest.config.js`

## Testing Strategy

### Unit Testing Approach

- Validate that `ApiError` constructor correctly assigns `message`, `status`, and `data`
- Validate that `apiRequest` converts network failures to `ApiError` with status 0
- Validate that `formatMoney` formats numbers according to Argentine locale rules
- Validate that `vi.mock()` successfully intercepts module imports

### Property-Based Testing Approach

Property-based testing is not appropriate for this spec because:
- The testing infrastructure is configuration, not transformational logic
- `formatMoney` behavior is deterministic and locale-dependent (not a pure transformation with invertible properties)
- `ApiError` is a simple data class with no complex invariants
- The goal is to validate that the infrastructure works, not to test algorithmic correctness

Standard example-based unit tests provide full coverage for these validation requirements.

### Integration Testing Approach

- The validation tests themselves serve as integration tests: they exercise the full chain from vitest.config.js → setup.js → test execution → assertion
- A passing test run confirms that jsdom, jest-dom matchers, and module mocking all integrate correctly

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2.0.0` | Test runner compatible with Vite |
| `@testing-library/react` | `^16.0.0` | React component testing utilities |
| `@testing-library/jest-dom` | `^6.0.0` | DOM assertion matchers |
| `@testing-library/user-event` | `^14.0.0` | Simulated user interactions |
| `jsdom` | `^24.0.0` | Browser environment simulation |
| `@vitest/coverage-v8` | `^2.0.0` | Code coverage via V8 instrumentation |

All packages are devDependencies only — they do not affect the production bundle.

## Correctness Properties

*Property-based testing is not applicable for this infrastructure spec. The validation tests use example-based assertions to confirm correct wiring of the test runner, matchers, and utilities. See the Testing Strategy section for rationale.*
