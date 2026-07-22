# Implementation Plan: Testing Infrastructure

## Overview

Set up Vitest with jsdom, React Testing Library, and a provider-wrapped custom render utility. Install all dependencies, create configuration files, add npm scripts, and write validation tests that confirm the infrastructure works end-to-end.

## Tasks

- [ ] 1. Install testing dependencies
  - Install devDependencies: `vitest@^2.0.0`, `@testing-library/react@^16.0.0`, `@testing-library/jest-dom@^6.0.0`, `@testing-library/user-event@^14.0.0`, `jsdom@^24.0.0`, `@vitest/coverage-v8@^2.0.0`
  - _Requirements: 1.1, 1.2, 2.1, 6.1_

- [ ] 2. Create Vitest configuration and test setup files
  - [ ] 2.1 Create `vitest.config.js` at the project root
    - Configure `plugins: [react()]`, `test.environment: 'jsdom'`, `test.setupFiles`, `test.globals: true`, and `test.coverage` with v8 provider
    - _Requirements: 1.1, 1.2, 1.3, 1.6_
  - [ ] 2.2 Create `src/test/setup.js`
    - Import `@testing-library/jest-dom` to register DOM matchers globally
    - _Requirements: 2.1, 2.2_
  - [ ] 2.3 Create `src/test/utils.jsx`
    - Implement `AllProviders` wrapper with BrowserRouter, AuthProvider, PurchaseProvider
    - Export custom `render` function and re-export all `@testing-library/react` exports
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Add package.json test scripts
  - Add `"test": "vitest"`, `"test:run": "vitest run"`, `"test:coverage": "vitest run --coverage"` to package.json scripts
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Write validation tests
  - [ ] 4.1 Create `src/lib/api.test.js`
    - Test that `new ApiError('msg', 404, {detail: 'x'})` sets `.message`, `.status`, `.data` correctly
    - Test that `apiRequest` throws `ApiError` with `status: 0` when `fetch` is unavailable (mock global fetch to throw)
    - Confirm `vi.mock()` can intercept the api module
    - _Requirements: 5.1, 5.2, 6.1, 6.2_
  - [ ] 4.2 Create `src/data/mockData.test.js`
    - Test `formatMoney(4500)` returns `"$4.500"`
    - Test `formatMoney(0)` returns `"$0"`
    - Test `formatMoney(1500000)` returns `"$1.500.000"`
    - _Requirements: 5.3_

- [ ] 5. Checkpoint — Verify all tests pass
  - Run `npx vitest run` and confirm all tests pass with exit code 0
  - Run `npx vitest run --coverage` and confirm coverage report is generated
  - Ensure all tests pass, ask the user if questions arise.
