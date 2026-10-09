# Landing hook and expandable film — 9 October 2026

The user requested a clearer first-screen hook and an expandable film, with [Brag](https://github.com/latent-spaces/brag) as a hierarchy reference. Reviewed its [published page](https://latent-spaces.github.io/brag/) and source. Traceli retains its navy/ivory typography and existing source qualifications. The supplied 55-second film remains unchanged.

## Verified locally

- Production build and type-check passed on Next.js 16.3.8; the relevant installed Next.js guides were read before implementation.
- Desktop at 1280 × 720: the promise, primary action and complete film preview are visible together. Mobile at 390 × 844: readable two-line headline, action and preview fit the screen. Neither has horizontal overflow.
- Initial DOM contains no video element. Opening the still preview creates the player and starts muted playback; the observed duration is 55.018 seconds. Native controls provide playback, seeking, audio and fullscreen.
- Enter opens the player and focuses its close control. Shift+Tab wraps to the direct-video link; Tab wraps back to close. Escape, the close button and backdrop dismiss the dialog, remove the video, release scroll locking and restore focus to the preview.
- Repeated opening succeeds. With the local film temporarily unavailable, the player showed “The film could not load. Use the direct video link below.” The asset was restored immediately; playback then succeeded.
- The native pilot disclosure reveals scope, review date and data-route boundaries on demand.
- Existing production smoke checks passed against the local production server, including public pages, film byte ranges, anonymous workspace redirects and protected API denials.

## Scope

Changes are limited to the introduction, film interaction and their design guidance. The existing research, case sources, professional-experience qualifiers and server authorization behavior remain intact. No new quantitative product claim or affiliation is introduced.

## Institutional-presence refinement

After the first deployment, the user requested less outer whitespace and more institutional weight in the first impression. The header, introduction and experience strip now share an 1800 px frame. At 1920 × 1080, the introduction begins 108 px from the edge and the film preview measures approximately 852 px wide; the former 1280 px frame would begin at 368 px and provide a 564 px film. The headline scales to 104 px on wide screens. The category uses the established “Award assurance for donor-funded procurement” statement. The film has a simple 12 px border radius without the floating shadow; the primary action uses a restrained 6 px radius. Experience qualifiers remain explicit and are more readable.

Verified the production build at 1920 × 1080, 1440 × 900, 1024 × 768, 390 × 844 and 320 × 740. All fit without horizontal overflow. Wide and standard desktop headlines retain two deliberate lines. At 390 px, the whole preview and its action remain within the initial viewport. The narrowest phone stacks navigation and allows readable headline wrapping. The film's keyboard-open, playback and Escape/focus-return behavior was rechecked. Type-check, production build and the existing local smoke checks passed.
