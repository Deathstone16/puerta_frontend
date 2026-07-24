# Requirements Document

## Introduction

This document defines the requirements for the reusable `<Sello />` design system component in the Norware Frontend nightclub ticketing platform. This component provides consistent visual representation of stamp/seal feedback for transaction and ticket status across multiple pages (CashierPage, PaymentProcessingPage).

## Glossary

- **Sello_Component**: A React component that renders an SVG stamp/seal used for visual status feedback in the nightclub ticketing system.
- **Estado**: A string identifier representing the status of a ticket or transaction (e.g., "aprobado_guardia", "rebotado_guardia", "ingresado_final", "ingresado", "cancelado", "procesando").
- **Design_Token**: A predefined color, font, or spacing value from the tailwind.config.js configuration file.
- **Physical_Object_Style**: A visual style rule where `border-radius: 0px` is applied to UI elements representing physical objects (stamps).

## Requirements

### Requirement 1: Sello Status Rendering

**User Story:** As a cashier or user viewing transaction status, I want to see a stamp/seal that clearly indicates the current status, so that I can quickly understand the outcome.

#### Acceptance Criteria

1. WHEN a valid `estado` prop is provided, THE Sello_Component SHALL render an SVG irregular octagon with a thick stroke and no fill.
2. THE Sello_Component SHALL apply the following rotation per estado: "aprobado_guardia" → -4deg, "rebotado_guardia" → 3deg, "ingresado_final" → -2deg, "ingresado" → -2deg, "cancelado" → 5deg, "procesando" → -3deg.
3. THE Sello_Component SHALL apply the following stroke color per estado: "aprobado_guardia" → uv (#8B5CF6), "ingresado" → uv (#8B5CF6), "rebotado_guardia" → door-red (#E23B5A), "cancelado" → door-red (#E23B5A), "ingresado_final" → strobe (#22D3EE), "procesando" → muted (#8A87A3).
4. THE Sello_Component SHALL render text centered inside the octagon in uppercase.
5. WHEN a `texto` prop is provided, THE Sello_Component SHALL use that value as the displayed text instead of the default estado label.
6. WHEN no `texto` prop is provided, THE Sello_Component SHALL display a default label derived from the estado value.

### Requirement 2: Sello Size and Animation

**User Story:** As a developer integrating the seal component, I want to control its size and animation, so that I can adapt it to different layout contexts.

#### Acceptance Criteria

1. WHEN the `size` prop is "sm", THE Sello_Component SHALL render at 80px width and height.
2. WHEN the `size` prop is "md", THE Sello_Component SHALL render at 128px width and height.
3. WHEN the `size` prop is "lg", THE Sello_Component SHALL render at 180px width and height.
4. THE Sello_Component SHALL render at 90% opacity to achieve the ink stamp visual effect.
5. WHEN the `animate` prop is true, THE Sello_Component SHALL apply the `animate-pulse-seal` Tailwind animation class.
6. WHEN the `animate` prop is false or not provided, THE Sello_Component SHALL render without animation.

### Requirement 3: Sello Visual Style

**User Story:** As a designer, I want the stamp to follow physical object design rules and look like a real ink stamp, so that the UI maintains the nightclub aesthetic.

#### Acceptance Criteria

1. THE Sello_Component SHALL render with `border-radius: 0px` following the Physical_Object_Style rule.
2. THE Sello_Component SHALL use font-mono (Space Mono) for the text inside the stamp.
3. WHEN an optional `className` prop is provided, THE Sello_Component SHALL merge the provided classes with the default component classes.

### Requirement 4: Component Testing

**User Story:** As a developer, I want automated tests for the Sello component, so that I can refactor with confidence and catch regressions early.

#### Acceptance Criteria

1. THE test suite SHALL verify that the Sello_Component renders an SVG element with the expected rotation and stroke color for each valid estado.
2. THE test suite SHALL verify that the Sello_Component respects the size prop by rendering at the correct pixel dimensions.
3. THE test suite SHALL verify that the Sello_Component applies the animation class when the `animate` prop is true and omits it when false.
4. THE test suite SHALL verify that the Sello_Component renders the correct text (custom texto prop or default label).
