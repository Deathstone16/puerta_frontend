import '@testing-library/jest-dom'

// Polyfill ResizeObserver for recharts in jsdom
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
