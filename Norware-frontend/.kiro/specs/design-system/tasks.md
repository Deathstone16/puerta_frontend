# Implementation Plan: Design System (Sello Component)

## Overview

Create the reusable `<Sello />` React component following the physical-object design rules. The component renders an SVG irregular octagon stamp with configurable estado, size, text, and animation. Testing infrastructure is assumed to be set up by the `testing-infrastructure` spec before this executes.

## Tasks

- [ ] 1. Implement Sello component
  - [ ] 1.1 Create `src/components/Sello.jsx`
    - Export `SELLO_CONFIG` map with 6 estado entries (color, rotation, defaultText)
    - Export `SELLO_SIZES` map (sm: 80, md: 128, lg: 180)
    - Export `Sello` component accepting `estado`, `size`, `texto`, `animate`, `className` props
    - Render SVG with viewBox="0 0 100 100" and irregular octagon path: `M 15 5 L 85 8 L 95 20 L 92 80 L 82 95 L 18 92 L 5 82 L 8 18 Z`
    - Stroke only (no fill), stroke-width 4
    - Apply rotation transform from config via inline style `transform: rotate(Xdeg)`
    - Set width/height from SELLO_SIZES (default to 'md' = 128px)
    - Render centered text element (text-anchor middle, dominant-baseline central, uppercase, font-mono)
    - Use `texto` prop if provided, otherwise `defaultText` from config
    - Apply 90% opacity to the wrapper element
    - Conditionally apply `animate-pulse-seal` class when `animate` is true
    - Merge optional `className` with default classes
    - For unknown estado: use fallback { color: '#8A87A3', rotation: 0, defaultText: '' }
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3_

- [ ] 2. Write unit tests for Sello
  - Create `src/components/Sello.test.jsx`
  - Test: each of the 6 estados renders correct rotation and stroke color
  - Test: SVG has stroke and fill="none"
  - Test: size "sm" renders 80px, "md" renders 128px, "lg" renders 180px
  - Test: default size is "md" (128px) when prop is omitted
  - Test: 90% opacity is applied
  - Test: `animate-pulse-seal` class present when `animate={true}`, absent when `animate={false}`
  - Test: custom `texto` prop overrides the default text
  - Test: default text matches SELLO_CONFIG[estado].defaultText
  - Test: unknown estado renders neutral fallback (muted color, 0 rotation)
  - Test: className prop merges with default classes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Checkpoint — Ensure all tests pass
  - Run `npm run test:run` and confirm Sello tests pass
  - Ensure the build still succeeds with `npm run build`

## Notes

- The component is pure presentational (no state, no effects, no API calls)
- Inline styles are required for SVG transforms since Tailwind can't handle arbitrary runtime rotation values
- The `animate-pulse-seal` animation is already defined in `tailwind.config.js`
- Testing infrastructure (Vitest + RTL) must be set up first via the `testing-infrastructure` spec
- No Pulsera component — pulseras were eliminated from scope per project decision
