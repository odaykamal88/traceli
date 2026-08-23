# Design QA

## Reference truth

- Selected source visual: `/Users/odaykamal/.codex/generated_images/01a01995-f070-7ec2-ab24-9b07e7896ceb/exec-f3ca073e-b24f-4e82-962a-717315979aef.png`
- Source pixel dimensions: 1487 × 1058
- Source state: Traceli public demo landing page, option 2 “Proof Console”

## Implementation evidence

- Final desktop capture: `/Users/odaykamal/Documents/Codex/2026-08-19/referenced-chatgpt-conversation-this-is-an/work/traceli-vanta-workos-ideation-2026-08-23/06-option-2-build-v2.jpg`
- Desktop CSS viewport: 1440 × 1024
- Desktop capture dimensions: 1440 × 1024 at 1× density
- Desktop state: top of the public story, no modal or drawer open
- Mobile capture: `/Users/odaykamal/Documents/Codex/2026-08-19/referenced-chatgpt-conversation-this-is-an/work/traceli-vanta-workos-ideation-2026-08-23/08-option-2-mobile.jpg`
- Mobile CSS viewport: 390 × 844
- Mobile capture dimensions: 390 × 844 at 1× density

## Comparison evidence

- Full-view V1 comparison: `/Users/odaykamal/Documents/Codex/2026-08-19/referenced-chatgpt-conversation-this-is-an/work/traceli-vanta-workos-ideation-2026-08-23/05-qa-source-vs-v1.png`
- Full-view V2 comparison: `/Users/odaykamal/Documents/Codex/2026-08-19/referenced-chatgpt-conversation-this-is-an/work/traceli-vanta-workos-ideation-2026-08-23/07-qa-source-vs-v2.png`
- The source was aspect-fit and cropped to the 1440 × 1024 implementation viewport before side-by-side comparison.
- No separate focused-region composite was needed: the hero and proof console occupy the complete desktop viewport and are both visible at legible scale in the full-view comparison.

## Comparison history

1. V1 showed a P2 composition mismatch: the header was too shallow, the proof console arrived too early, and the console was vertically compressed.
2. Increased demo header height, delayed the console reveal, and expanded the console rows and action area.
3. V2 aligned the reference hierarchy and rhythm: quiet utility header, single serif promise, two restrained actions, and a large cream proof surface emerging from the glow. No P0, P1, or P2 visual mismatch remained.

## Responsive and interaction checks

- 390 px viewport has no horizontal overflow (`scrollWidth` equals `innerWidth`, both 390 px).
- “See the proof” moves to `#proof` and scrolls to the second story beat.
- “Open the proof” opens the forensic audit trail with the preserved record chronology.
- “Back to story” restores the public landing story.
- “Open live workspace” opens the assurance portfolio.
- Browser logs contain only React development and hot-reload informational messages; no warnings or errors were recorded.
- TypeScript check passed.
- Production build passed.
- The configured lint command could not run because the repository does not include the `eslint` executable in its installed dependencies.

## Final result

passed
