# Traceli first-screen comparator research

Date: 24 August 2026

## Scope

Compare the first useful screen of Traceli with Cohere, WorkOS, and Vanta, focusing on information density, hierarchy, task entry, trust, and visible calls to action.

## Captured evidence

1. `01-traceli-workspace.jpg` — current Traceli Procurement Officer workspace.
2. `02-cohere-home-first-screen.jpg` — Cohere public landing page, first viewport.
3. WorkOS public landing page and dashboard documentation were inspected through the live page structure and official documentation. Repeated browser screenshot attempts failed, so no screenshot is accepted as audit evidence.
4. Vanta public landing page and official Home Page guide were inspected through the live page structure and official documentation. Repeated browser screenshot attempts failed, so no screenshot is accepted as audit evidence.

## Step health

### 1. Traceli workspace — needs simplification

The screen has a correct primary task, but six competing information groups appear before the user has acted: global controls, two sidebar panels, tender context, the action card, a safety explainer, and a four-step workflow. The page explains the system before letting the officer use it.

### 2. Cohere landing page — strong

The first viewport is built around one promise, one supporting sentence, two calls to action, one proof visual, and customer logos. Trust is communicated through restraint and evidence rather than a large explainer panel.

### 3. WorkOS landing page and dashboard model — strong, capture limited

The landing page uses one outcome, one sentence, two calls to action, and a compact readiness signal. Its dashboard documentation separates team, project, and environment scope, then points users to common tasks instead of exposing every configuration area on the home screen.

Sources:

- https://workos.com/
- https://workos.com/docs/dashboard

### 4. Vanta home-page model — strongest direct analogue, capture limited

Vanta defines its home page as an at-a-glance view. It deliberately limits the page to three sections: compliance progress, monitoring, and trust centre engagement, plus outstanding or due-soon tasks. Cards navigate into filtered detail views.

Sources:

- https://www.vanta.com/
- https://help.vanta.com/en/articles/11345372-home-page

## Recommendation: a quiet control tower

Traceli should adopt the Vanta home-page model with the visual restraint of Cohere and WorkOS.

The first viewport should contain only:

1. A calm greeting and one-line status: `One tender needs your attention.`
2. One primary task card: `Northstar Relief is missing Ethiopia delivery evidence.`
3. One compact procurement-progress row: `Evidence 23/27 · Approvals 2 outstanding · Record draft.`
4. A short list of the officer's active procurements, with status and next action.

Safety should be a persistent system signal, not a competing content block:

- `Source linked`
- `Human approval required`
- `Recorded in audit trail`

These can sit below the primary action or in a small status bar. The large green “Protected by design” panel should move to an assurance drawer or dedicated page.

## Keep, trim, and move

### Keep on the first screen

- Tender requiring attention
- One next action
- Compact blockers/progress
- Active procurements list
- Safe-demo/authenticated-workspace status

### Trim

- Long tender description
- Repeated labels for role, access, demo mode, and governance boundary
- Four equal workflow tiles
- Oversized decision-record button
- Explanatory trust copy visible before interaction

### Move into detail views

- Access envelope details
- Protected-by-design explanation
- Golden thread
- Human-control breakdown
- Full audit chronology
- Governing-rule explanation

## Proposed first-screen hierarchy

`Good morning, Leila`

`One tender needs your attention.`

Primary task card:

`Missing delivery evidence · Northstar Relief`

`REQ-07 requires Ethiopia-specific capacity evidence. No compliance decision has been made.`

`Review evidence`

Compact assurance line:

`Source linked · Human decision required · Activity retained`

Then:

`Your procurements`

Three concise rows at most, with tender, stage, blocker, and next action.

## Accessibility observations

- Traceli's small uppercase labels and muted supporting text risk becoming difficult to scan at zoom or on lower-quality meeting displays.
- The current number of bordered regions weakens visual grouping and increases cognitive load.
- The semantic button and heading structure is generally sound, but keyboard focus order, visible focus treatment, responsive reflow, and contrast still require direct testing.

## Evidence limits

This is a bounded first-screen comparison, not a full accessibility audit. Cohere and Traceli were visually captured and inspected. WorkOS and Vanta were accessed live and corroborated through official sources, but their screenshots could not be captured during this run; visual conclusions for those two are limited to live structure and documented information architecture.
