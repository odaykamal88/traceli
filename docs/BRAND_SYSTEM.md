# Traceli brand and product-expression system

Updated: 26 August 2026

This is the canonical reference for Traceli's public story, visual language, product iconography, affiliation treatment, and demonstration assets. New screens and marketing surfaces should extend this system rather than inventing a parallel one.

## The promise

Primary statement:

> Every award, audit ready.

Traceli should be understood in ten seconds as the assurance layer that keeps procurement rules, evidence, human decisions, exceptions, approvals, and chronology connected. The first useful demonstration must answer one question: **why did this supplier win?**

Use plain procurement outcomes before technical mechanisms. Prefer `Draft from your rules`, `Run the evaluation`, and `Defend the award` over a feature catalogue. Do not describe Traceli as autonomous decision-making, an AI scoring engine, or another tender portal.

## The 10/90 interaction rule

- The first viewport earns attention in ten seconds: one promise, one supporting sentence, one dominant walkthrough action, and one secondary workspace path.
- The next ninety seconds show one deterministic tender-to-proof story. Avoid carousels, competing dashboards, or explanations that duplicate the product visual.
- Start the walkthrough from a clean tender workspace. Show information appearing only when the corresponding action occurs.
- End with a low-friction pilot request: `Bring one completed tender.`
- Label fictional, staged, sanitized, and not-yet-live behavior explicitly.

## Visual hierarchy

Traceli borrows the discipline—not the identity—of mature enterprise platforms such as WorkOS and Vanta:

1. Quiet external affiliation marks.
2. Strong proprietary product identity.
3. Product surfaces that demonstrate the claim.
4. Restrained copy and generous negative space.

The public page uses a dark assurance field around the promise and an ivory operational field for product explanations. Dense application screens may use more neutral surfaces, but the same hierarchy and tokens apply.

## Core palette

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Deep field | Navy 950 | `#061a33` | Public hero, header, high-trust backgrounds |
| Primary ink | Navy 900 | `#071d39` | Text, controls, product framing |
| Warm paper | Ivory 50 | `#fbf5ea` | Wordmark, primary light surfaces, hero type |
| Assurance signal | Mint 400 | `#78d8c4` | Verified states, trace nodes, restrained accents |
| Operational paper | Ivory 100 | `#f7f3eb` | Content sections and product explanation |
| Affiliation glass | White 5.5 | `rgba(255,255,255,0.055)` | Translucent experience-mark blocks over the navy gradient |

Mint signals assurance or linked evidence; it is not general decoration. Red and amber are reserved for genuine risk, exception, or blocked states.

## Typography

- **IBM Plex Sans** is the interface and body face. It should feel operational and legible.
- **Newsreader** is the display face for the primary promise and a small number of major section statements.
- **IBM Plex Mono** is reserved for identifiers, sequence labels, evidence metadata, and compact status language.
- Avoid using display type for dense application controls or mono type for long prose.
- Headlines should be short, with tight tracking and deliberate line breaks. Supporting copy should remain readable at normal interface sizes.

## Traceli mark and wordmark

The Traceli emblem is a trace-node system: a layered diamond field, connected waypoints, and one mint terminal node. It represents a source-linked decision path rather than a generic security shield.

- Keep the emblem and `TRACELI` wordmark together in primary navigation and formal brand contexts.
- Use ivory for the wordmark on navy. Preserve the mint terminal node.
- Maintain clear space of at least half the emblem width around the lockup.
- Do not substitute generic shields, locks, sparkles, brains, robots, or model-provider marks.
- Do not stretch, rotate, recolor, add slogans inside, or place the mark on visually noisy imagery.

The current in-product lockup is canonical for the pilot. A future professionally drawn vector may refine its geometry, but it must preserve the trace-node concept and remain recognizably continuous with this version.

## Product icons

External brands recede; Traceli product capabilities receive the richer visual treatment.

- Use one semantic line icon from the existing icon library as the primary glyph.
- Place it in a layered tile with a restrained grid, soft directional gradient, and one small secondary status glyph.
- Keep line weight and corner language consistent across a set.
- Use mint for rule/evidence preparation, blue for evaluation/inspection, and violet for assurance/locked proof.
- Every icon must support a named workflow outcome. Avoid decorative icon proliferation.
- Preserve an accessible text label; icons never carry the meaning alone.

## Affiliation and experience marks

The experience strip is biography, not customer proof.

- Approved language: `Built by the people from`.
- Required qualifier: `Individual prior experience—not customers, partners or endorsements.`
- Never use `Trusted by`, customer language, or an unqualified `Built by` beside these marks.
- Render all marks in one monochrome ivory-grey treatment on equal translucent blocks so the Traceli field remains visible. Keep sufficient mark opacity for legibility; Traceli remains the only full brand expression in the section.
- Keep the marks optically balanced rather than forcing identical pixel dimensions.
- Verify the named person's genuine relationship before adding a mark.
- Record written mark-use approval where an organization's policy requires it. If affiliation or permission is unresolved, remove the mark and use plain text until cleared.

The initial candidate set is WFP, UN Climate Change, Oxfam, Google, and Careem. Inclusion in code is not evidence that the relationship or permission gate has passed. Track the gate in [AFFILIATION_REGISTER.md](./AFFILIATION_REGISTER.md); do not put private employment evidence or personal records in the public repository.

## Demonstration and evidence rules

- Use an actual video file for the public walkthrough, not a timed carousel presented as video.
- Cache DIHAD demonstration assets so playback does not depend on a third-party portal.
- Use a public completed tender or a buyer-approved irreversibly sanitized pack.
- Fictional suppliers, awards, integrity concerns, and decisions must be labelled fictional.
- Do not imply that a staged import, integration, risk signal, or audit export is live when it is not.
- Every consequential product claim should eventually open its source, actor, and chronology.

## Contact placement

The canonical public contact address is `hello@trace-li.com`.

- Place it beneath the final pilot invitation and in the global footer, where contact intent is highest.
- Keep it out of the first viewport so the ten-second promise and primary walkthrough action remain dominant.
- Use a direct `mailto:` link and display the full address.
- Do not publish an alternate spelling or mailbox domain without confirming that its MX records and delivery path are active.

## Release gates

Before a public brand release:

1. The ten-second promise and ninety-second journey still hold at desktop and mobile widths.
2. The Traceli lockup, product glyph grammar, palette, and typography match this reference.
3. Affiliation wording is present and every displayed mark has an owner, verified relationship, and recorded permission status.
4. The product film returns `200`, supports byte ranges, plays from a clean state, and retains its fictional-data disclosure.
5. Keyboard focus, contrast, reduced motion, alt text, and responsive overflow checks pass.
6. Any deliberate exception is documented in the implementation plan before release.

## Build-system ownership

- `components/landing-page.tsx` is the current executable public expression of this system.
- `docs/IMPLEMENTATION_PLAN.md` owns sequencing, maturity, and honest capability boundaries.
- `docs/AFFILIATION_REGISTER.md` owns mark-clearance state.
- `.github/PULL_REQUEST_TEMPLATE.md` turns the release gates into a repeatable review step for future public UI changes.
- Visual QA evidence may live under `docs/audits/`, but historical screenshots do not override this canonical reference.
