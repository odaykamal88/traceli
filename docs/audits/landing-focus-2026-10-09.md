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
