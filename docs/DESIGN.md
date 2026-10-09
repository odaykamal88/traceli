# Traceli implementation design contract

Derived 9 October 2026 from [BRAND_SYSTEM.md](BRAND_SYSTEM.md) and the implemented public UI. The brand system remains authoritative. This contract guides the landing-page refinement requested on 9 October; it does not authorize new claims or affiliations.

## Tokens and typography

| Role | Implemented value |
| --- | --- |
| Public field | Navy `#061a33` |
| Primary ink | Navy `#071d39` |
| Paper and hero type | Ivory `#fbf5ea` |
| Linked-evidence accent | Mint `#78d8c4` |
| Body and interface | IBM Plex Sans |
| Main promise | Newsreader, short deliberate lines |
| Compact metadata | IBM Plex Mono |

Keep body copy at 16–20 px with comfortable line height. Use mono for concise metadata, not explanatory prose. Preserve the existing trace-node wordmark in `components/landing-page.tsx`.

## Hierarchy, spacing and shape

The first screen has a short category, one promise, one supporting sentence and one dominant file-discussion action. The film is the secondary action. All landing-page regions—header, hero, experience strip, research, cases, outcomes, FAQ, documentation, pilot panel and footer—must use the same 1800 px outer frame and 20/32/48 px inner gutters at phone/tablet/desktop sizes. Put horizontal gutters inside the frame, never on the section outside it. Use shared desktop columns for the hero, research, cases and FAQ so the transition between sections follows one grid. Individual paragraphs may have narrower reading measures; they do not change the section's alignment.

Use one content-section spacing rule: 48/64/80 px vertical padding at phone/tablet/desktop sizes, with height driven by content rather than a hero-specific minimum. The experience strip and footer are compact bands with 32–40 px padding. At wide desktop sizes, the film occupies slightly more than half the frame and the headline grows to 104 px. Keep explanatory text limited to 540 px; scale presence through typography and the film rather than more copy. Use 32–64 px between text and media, 6 px action corners and 12 px media corners, with a simple border and no floating-card shadow.

Pilot scope, data-route qualification, source cases and professional experience follow the hook. A native disclosure reveals pilot details. Existing institutional marks retain their provenance qualifier and sit below the primary introduction.

## Film anatomy and responsive behavior

`components/landing-film.tsx` owns a static 16:9 preview with a visible play label, a 55-second duration and an expand affordance. The supplied film and poster remain the assets approved on 6 October. Opening the preview creates one video in a native modal dialog; built-in controls provide pause, seeking, audio and fullscreen. Keep the fictional-data qualifier beside the preview and player.

At desktop widths, copy and film sit side by side. Below 1024 px, copy precedes the film. Keep the primary action and preview visible without horizontal overflow, with controls at least 44 px high. The dialog fits within the available viewport and scrolls on short screens; its video preserves 16:9 without cropping.

## States, motion and accessibility

The initial preview is still and loads no MP4. Playback starts only after the visitor opens the film, muted by default. No looping, pulsing, entrance choreography or background animation. Hover effects are limited to color; reduced-motion users see the same complete static presentation.

The native dialog makes the rest of the page inert, contains keyboard focus, closes with Escape, stops playback on close and restores focus to the initiating control. Lock background scrolling only while the dialog is open and restore prior styles on cleanup, including Next.js Activity hiding. Provide a visible close button and a clear title. Playback loading and errors have explicit text; a direct video link remains available. Buttons and links retain visible focus rings.

## Evidence and procurement semantics

Keep missing evidence distinct from adverse evidence and unknown status. Red and amber are for actual exception or blocked states. Mint is for relationships and verified evidence, not decoration. The film is illustrative; it is not a live customer workflow or a compliance guarantee. Supporting case claims and source links are unchanged. Authorization and identity remain server-side; hiding interface content is not an authorization control.

## Examples

Do: lead with “Be ready to explain the award,” a concise description and “Discuss one file”; let the visitor choose to watch a larger film.

Do: keep the pilot boundary readable inside “How the pilot works” and preserve fictional-data labels.

Do not: autoplay a competing film beside a paragraph of instructions, add multiple primary buttons, hide the close control, or crop the expanded video.

## Verification

Check the complete page at desktop and mobile widths, including every section transition, shared left/right bounds and desktop columns. First-screen-only review is insufficient. Check keyboard open/close and focus restoration, Escape/backdrop dismissal, media cleanup, disclosure behavior, loading/error text, and no MP4 request before opening. Run type-check, production build and the existing production smoke check. Record release evidence in the PR and dated audit notes.
