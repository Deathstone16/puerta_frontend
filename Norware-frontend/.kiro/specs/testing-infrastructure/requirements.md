# Requirements Document

## Introduction

This feature establishes the testing infrastructure for the Norware Frontend project. The project currently has no testing setup. This spec defines the requirements for configuring Vitest as the test runner, React Testing Library for component testing, and providing shared test utilities that wrap application providers. Once complete, all future features can rely on this foundation to write and run tests.

## Glossary

- **Test_Runner**: The tool that discovers, executes, and reports on test files (Vitest in this project)
- **Test_Environment**: The simulated browser environment used during test execution (jsdom)
- **Test_Utility**: A shared module providing helper functions for rendering components under test with required context providers
- **Provider_Wrapper**: A React component that wraps the component under test with BrowserRouter, AuthProvider, and PurchaseProvider
- **Coverage_Reporter**: The tool that instruments code and reports which lines and branches are exercised by tests (@vitest/coverage-v8)
- **Setup_File**: A file executed before each test file to configure global matchers and environment extensions

## Requirements

### Requirement 1: Test Runner Configuration

**User Story:** As a developer, I want Vitest configured as the test runner, so that I can run tests in an environment compatible with the existing Vite build tool.

#### Acceptance Criteria

1. THE Test_Runner SHALL use jsdom as the Test_Environment for all test files
2. THE Test_Runner SHALL resolve module imports using the same Vite configuration used for production builds
3. THE Test_Runner SHALL execute the Setup_File before each test file runs
4. WHEN a developer runs the `test` script, THE Test_Runner SHALL start in watch mode
5. WHEN a developer runs the `test:run` script, THE Test_Runner SHALL execute all tests once and exit with a pass or fail status code
6. WHEN a developer runs the `test:coverage` script, THE Coverage_Reporter SHALL produce a coverage report excluding test files and node_modules

### Requirement 2: DOM Matchers Setup

**User Story:** As a developer, I want DOM-specific matchers available in every test, so that I can write assertions like `toBeInTheDocument()` without manual imports.

#### Acceptance Criteria

1. THE Setup_File SHALL import `@testing-library/jest-dom` to extend the default matchers
2. WHEN any test file executes, THE Test_Runner SHALL have DOM matchers available globally without per-file imports

### Requirement 3: Provider-Wrapped Render Utility

**User Story:** As a developer, I want a custom render function that wraps components in all application providers, so that I can test components that depend on AuthContext, PurchaseContext, or React Router without boilerplate.

#### Acceptance Criteria

1. THE Test_Utility SHALL export a custom `render` function that wraps the component under test with a Provider_Wrapper
2. THE Provider_Wrapper SHALL include BrowserRouter, AuthProvider, and PurchaseProvider
3. THE Test_Utility SHALL re-export all exports from `@testing-library/react` except its own `render`
4. WHEN a component uses the `useAuth()` hook, THE Provider_Wrapper SHALL supply a valid AuthContext so the component renders without errors
5. WHEN a component uses the `usePurchase()` hook, THE Provider_Wrapper SHALL supply a valid PurchaseContext so the component renders without errors

### Requirement 4: Package Scripts

**User Story:** As a developer, I want npm scripts for running tests, so that I can invoke tests through a standard interface.

#### Acceptance Criteria

1. THE package.json SHALL contain a `test` script that invokes the Test_Runner in watch mode
2. THE package.json SHALL contain a `test:run` script that invokes the Test_Runner for a single execution
3. THE package.json SHALL contain a `test:coverage` script that invokes the Test_Runner with coverage reporting

### Requirement 5: Validation Tests

**User Story:** As a developer, I want sample tests that exercise core utilities, so that I can verify the testing infrastructure works end-to-end.

#### Acceptance Criteria

1. WHEN the `ApiError` class is instantiated with a message, status, and data, THE validation test SHALL confirm the instance contains the provided message, status, and data properties
2. WHEN `apiRequest` encounters a network failure, THE validation test SHALL confirm an `ApiError` is thrown with status 0 and an appropriate message
3. WHEN `formatMoney` receives a numeric value, THE validation test SHALL confirm the output is formatted as Argentine pesos with no decimal digits

### Requirement 6: Module Mocking Support

**User Story:** As a developer, I want the ability to mock modules during tests, so that I can isolate components from external dependencies like the API layer.

#### Acceptance Criteria

1. THE Test_Runner SHALL support `vi.mock()` for replacing module implementations during tests
2. WHEN a test mocks the `api` module, THE Test_Runner SHALL intercept all imports of that module within the component under test
