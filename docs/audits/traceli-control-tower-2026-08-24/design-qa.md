# Design QA — Workspace Quiet Control Tower

## Source visual truth

- Figma file: `https://www.figma.com/design/P1hgv9eed7gKX6nCNT7aSK`
- Selected source node: `3:7` — `Traceli / Today / Quiet Control Tower`
- Intended source frame: 1440 × 900 desktop workspace
- Source state: one procurement requires evidence review
- Source capture status: unavailable. The Figma Starter plan MCP allowance was exhausted before design context or a screenshot could be retrieved.

## Implementation evidence

- Desktop capture: `docs/audits/traceli-control-tower-2026-08-24/workspace-desktop-1280x720.png`
- Desktop viewport and pixels: 1280 × 720 at 1× density
- Mobile capture: `docs/audits/traceli-control-tower-2026-08-24/workspace-mobile-390x844.png`
- Mobile viewport and pixels: 390 × 844 at 1× density
- Evidence-drawer capture: `docs/audits/traceli-control-tower-2026-08-24/evidence-drawer-1280x720.png`
- Route: `/workspace`
- Auth state: meeting-safe demo viewer with fictional procurement data

## Findings

- [P2] Source-to-implementation visual comparison is blocked
  - Location: Figma node `3:7` versus the `/workspace` implementation.
  - Evidence: the implementation is captured at desktop and mobile sizes, but Figma rejected both `get_design_context` and screenshot requests after the Starter plan monthly call limit was reached.
  - Impact: typography, spacing, color, copy and component proportions cannot be objectively signed off against the visible Figma frame in a same-input comparison.
  - Fix: after the Figma allowance resets or the plan is upgraded, retrieve the source frame, create a same-viewport comparison, and resolve any P0–P2 drift before final design sign-off.

## Implementation-only checks

- Fonts and typography: IBM Plex Sans and IBM Plex Mono load through `next/font`; the workspace uses a clear 48–50px desktop greeting, 38–40px action heading, and compact mono state labels. No visible clipping was found in desktop or mobile captures.
- Spacing and layout rhythm: the desktop shell uses a 224px sidebar, restrained top bar, one primary action card, and a three-row procurement queue. The mobile layout stacks without horizontal overflow.
- Colors and visual tokens: navy, warm ivory, muted teal and field ochre follow the existing Traceli tokens. State colors remain semantic and meet the intended visual hierarchy.
- Image quality and asset fidelity: the selected screen contains no raster imagery. All visible interface icons use the project’s installed Lucide library.
- Copy and content: the first view answers what needs attention, why it matters, and what the officer should do next. Safety is expressed as compact system signals rather than a competing explanatory panel.

## Interaction and responsive checks

- `Review evidence` opens the evidence inspection drawer.
- `Open supplier clarification` advances to the clarification view.
- Attaching the response returns to Today and changes the primary state to `Panel sign-off is incomplete`.
- Escape/close behavior remains available through the existing drawer system.
- Mobile width: `scrollWidth` 390 equals `innerWidth` 390.
- Browser console: no errors or warnings in the final top state.
- TypeScript: passed.
- Production build: passed.

## Full-view comparison evidence

Blocked because the source Figma frame could not be captured after the monthly MCP limit was reached.

## Focused comparison evidence

Blocked for the same reason. The action card, assurance strip and procurement queue should receive the first focused comparison when Figma access resumes.

## Comparison history

1. The prior workspace exposed multiple competing panels: access envelope, active procurement, governance boundary, protection explanation, workflow steps and three metric cards.
2. The implementation replaced that density with one judgment card, three ambient assurance signals and a three-row procurement queue.
3. Desktop, mobile and drawer captures were reviewed for implementation-only issues; no visible clipping, horizontal overflow, broken hierarchy or console errors remain.
4. A source-versus-implementation fidelity pass could not be run because the source frame is temporarily inaccessible to the design tools.

## Final result

blocked
