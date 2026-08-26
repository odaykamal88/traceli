# Design QA — Traceli Product Film Hero

## Source visual truth

- Overall Traceli hero direction: `/Users/odaykamal/.codex/generated_images/01a01995-f070-7ec2-ab24-9b07e7896ceb/exec-f3ca073e-b24f-4e82-962a-717315979aef.png`
- Clean film opening frame: `/Users/odaykamal/Documents/ChatGPT/Traceli/public/traceli-tender-to-proof-poster.png`
- Latest product direction: retain the Traceli navy/ivory editorial identity, use the left-led clarity of WorkOS, and replace the prior static walkthrough with a real Vanta-style product film that begins from an empty procurement workspace.
- State: landing page at the beginning of the 44-second tender-to-proof film.

## Implementation evidence

- Route: `/`
- Desktop capture: `docs/audits/traceli-product-film-2026-08-26/landing-desktop-1440x900-fixed.png`
- Desktop viewport and pixels: 1440 × 900 CSS px, 1440 × 900 image px, 1× density.
- Mobile capture: `docs/audits/traceli-product-film-2026-08-26/landing-mobile-390x844-fixed.png`
- Mobile viewport and pixels: 390 × 844 CSS px, 390 × 844 image px, 1× density.
- Focused film capture: `docs/audits/traceli-product-film-2026-08-26/film-clean-state-desktop-focused-fixed.png`
- Focused source/implementation comparison: `docs/audits/traceli-product-film-2026-08-26/clean-state-comparison.png`
- Full-view source/implementation comparison: `docs/audits/traceli-product-film-2026-08-26/full-view-comparison.png`
- Source film pixels: 1280 × 718 H.264 MP4; poster pixels: 1280 × 720.
- Focused comparison normalization: the 1280 × 720 source poster and 704 × 397 embedded film region were placed in equal 704 × 397 panels for visual comparison. The implementation capture is softer because the browser-capture surface returned a compressed raster; the shipped MP4 remains the original 1280-pixel source.

## Findings

- No actionable P0, P1 or P2 design mismatches remain.
- [P3] The browser-captured focused comparison looks slightly softer than the source poster.
  - Location: embedded film region on the desktop hero.
  - Evidence: the focused capture was produced through the browser screenshot pipeline and then normalized; the shipped poster and MP4 retain their original dimensions and sharpness.
  - Impact: capture-only softness; it does not affect the actual source media.
  - Follow-up: if needed after deployment, compare the Vercel-served film on a Retina display and tune encoding bitrate only if real-world compression is visible.

## Required fidelity surfaces

- Fonts and typography: the editorial serif headline, compact mono assurance label and restrained sans-serif body hierarchy match the established Traceli direction. Desktop and mobile captures show no clipping, collision or awkward wrapping.
- Spacing and layout rhythm: the left-led hero and right-side film create one obvious scan path. The film is large enough to read at desktop, drops below the primary action on mobile, and keeps practical 44px controls. Mobile `scrollWidth` equals the 390px viewport width.
- Colors and visual tokens: navy, warm ivory and teal remain consistent across the landing page, the film poster and the product workspace. The video surface reads as a deliberate bright focal point against the dark hero.
- Image quality and asset fidelity: the hero now uses a genuine screen-recorded H.264 MP4 rather than a carousel or code-simulated sequence. A dedicated clean-state poster prevents a flash of an arbitrary later frame.
- Copy and content: “Every award, audit ready,” “Watch the product film,” and “Start with one tender” establish the problem, the action and the product’s first step without extra explanation.
- Icons and controls: all controls use the installed Lucide family with consistent stroke weight and 44px tap targets. No custom SVG, emoji or placeholder art is present.
- Accessibility: the film is muted, labelled, keyboard-operable, pauseable, replayable, inline on mobile and respects reduced-motion preferences by pausing automatic playback.

## Full-view comparison evidence

`docs/audits/traceli-product-film-2026-08-26/full-view-comparison.png` shows that the implementation preserves the reference’s serif statement, navy/ivory palette, product proof surface and teal light treatment. The centered copy and tilted static console from the earlier reference were intentionally superseded by the later WorkOS/Vanta direction: left-aligned proposition, one real film surface and a simpler conversion path.

## Focused comparison evidence

`docs/audits/traceli-product-film-2026-08-26/clean-state-comparison.png` confirms that the embedded film opens on the same empty workspace as the source poster: Traceli header, “Start with one tender,” one import action and no premature award or supplier data. The implementation adds only the landing-page playback and restart controls.

## Interaction and responsive checks

- `Watch the product film` resets the film to 0:00, requests playback and scrolls the film into view.
- The round control toggles play/pause; `Start again` resets playback to 0:00.
- The film is configured for muted autoplay, inline playback and looping, with an `onCanPlay` retry for browsers that delay media readiness.
- Reduced-motion preference pauses automatic playback.
- The embedded browser QA surface exposed the video and controls but did not report decoder progress; native media inspection confirmed a 44-second H.264 MP4 and representative frames across the complete workflow.
- Browser console: no errors or warnings after exercising the film controls.
- TypeScript: passed.
- Production build: passed.
- Temporary recording route and recorder-only UI were removed from the shipping application.

## Comparison history

1. The prior landing implementation used a React-driven carousel that changed screens on a timer.
2. It was replaced with one continuous 44-second product recording showing a tender moving from import to requirements, matrix confirmation, supplier evaluation, integrity review and decision proof.
3. The film opening was revised to a completely empty workspace with one obvious import action, matching the user’s Vanta-inspired requirement.
4. Playback controls, a clean poster, replay behavior, reduced-motion handling and mobile layout were added.
5. Desktop and mobile captures found no layout overflow or P0–P2 visual defects; the final production build passed.

## Final result

passed
