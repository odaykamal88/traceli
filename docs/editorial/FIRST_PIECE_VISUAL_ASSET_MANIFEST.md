# Visual asset manifest: Before You Sign 01

Updated: 8 September 2026

**Asset status:** `APPROVED FOR PUBLICATION — release exports verified 8 September 2026`

**Source copy:** Controlled by the separate editorial distribution pack and source sheet in the working workspace; those files are included in the approved release commit.

**Generator:** [`scripts/generate-first-piece-social-assets.py`](../../scripts/generate-first-piece-social-assets.py)

The review originals retain their labels. The separate approved release set is `output/social/before-you-sign-01-release/`, with `output/pdf/before-you-sign-01-linkedin-document.pdf`. All seven final PDF pages were rendered and visually inspected; document tags and five link annotations were checked. The release removes the review badge, corrects the OIOS direct source and uses the approved service CTA. No institution-specific claim changed.

## LinkedIn company Page document

**Review PDF:** `output/pdf/before-you-sign-01-linkedin-document-review.pdf`

**Format:** Seven pages, 1080 by 1350 pixels. The PDF is formally tagged: its reading order contains seven figure elements with complete page-level alt text, and the official-source and contact regions are clickable. The page artwork is rasterized to preserve exact parity with the platform PNGs.

| Page | PNG | Job |
| --- | --- | --- |
| 1 | `output/social/before-you-sign-01/linkedin/01-cover.png` | Stop the scroll with the article title and five-part trace |
| 2 | `output/social/before-you-sign-01/linkedin/02-control-moment.png` | Show the governing rule, evidence, named human judgment, exception and approval |
| 3 | `output/social/before-you-sign-01/linkedin/03-auditability-financial-eligibility.png` | Separate the OIOS auditability record from the OLAF financial-eligibility record |
| 4 | `output/social/before-you-sign-01/linkedin/04-funding-continuity-integrity-exposure.png` | Separate the OLAF funding recommendation from the World Bank debarment |
| 5 | `output/social/before-you-sign-01/linkedin/05-recurring-question.png` | Connect four consequence families to one control question without implying prevalence |
| 6 | `output/social/before-you-sign-01/linkedin/06-seven-questions.png` | Give the reader the completed-award test |
| 7 | `output/social/before-you-sign-01/linkedin/07-where-traceli-fits.png` | State Traceli's role, boundaries and pilot action |

**Document alt text:** Seven-page Traceli document titled “The award was signed. The proof was not ready.” It traces a procurement award from governing rule and source evidence through named human judgment, exceptions and approval; summarizes four official UN OIOS, OLAF and World Bank records with their distinct procedural labels; asks seven award-readiness questions; and closes with Traceli's bounded assurance role. The institutions are not Traceli customers or endorsers, and the records are not prevention claims.

## X thread image sequence

All files are 1600 by 900 pixels.

| Thread post | PNG | Suggested alt text |
| --- | --- | --- |
| 1 | `output/social/before-you-sign-01/x/01-thread-cover.png` | Navy Traceli card titled “The award was signed. The proof was not ready.” A trace links rule, evidence, named human judgment, exception and approval. |
| 2 | `output/social/before-you-sign-01/x/02-auditability.png` | UN OIOS auditability card. A final internal-audit report found UNMISS bid evaluations were not timely and their documentation was inadequate; recommendations were accepted and later recorded as implemented. |
| 3 | `output/social/before-you-sign-01/x/03-financial-eligibility.png` | OLAF financial-eligibility card showing €7.5 million financial impact and corresponding payments considered ineligible, labelled as an investigative finding and recommendations rather than a final judgment or completed recovery. |
| 4 | `output/social/before-you-sign-01/x/04-funding-continuity.png` | OLAF funding-continuity card showing its recommendation to protect €112 million of future IPARD funding until remedial measures were in place. The card states that the source does not establish suspension or recovery. |
| 5 | `output/social/before-you-sign-01/x/05-integrity-exposure.png` | World Bank integrity-exposure card showing a 63-month settlement-based debarment after false past-experience claims in two financed-project bids. |
| 6 | `output/social/before-you-sign-01/x/06-control-question.png` | Navy card listing auditability, financial eligibility, funding continuity and integrity exposure beneath the question: could the accountable team prove the award before signing it? |

## Chart decision

No bar, line or shared-axis comparison is used. `€7.5 million`, `€112 million`, `63 months` and an audit documentation finding measure different things and arise from different procedural records. Presenting them on one quantitative scale would imply a comparison the sources do not support. The asset set uses labelled consequence cards and a relationship diagram instead.

## Rebuild command

Run the deterministic generator from the repository root:

```text
python3 scripts/generate-first-piece-social-assets.py
```

The Python environment needs ReportLab and pypdf; Node needs Playwright and a Chromium-compatible browser. The generator also recognizes Codex's bundled workspace runtime when present. It creates the PDF and PNG pages, rebuilds the PDF as a tagged document with page-level alt text, and then adds the official-source link annotations. It does not call an image model; deterministic typography and layout are required so that source amounts, procedural labels and claim boundaries remain exact.

## Historical release checklist

- Recheck each official source on the publication date.
- Record factual review for C-001 through C-010.
- Follow the current owner release decision in APPROVALS_REGISTER.md; no independent review is claimed.
- Record Odey's exact approval for the LinkedIn document and X sequence.
- Verify the canonical article URL and replace any review-stage destination assumptions.
- Remove the visible review label only in a separately generated public-release set.
- Confirm the PDF's page order, links, extracted reading order and contrast after the release export.

## Approved release generation

Run `TRACELI_SOCIAL_RELEASE=1 python3 scripts/generate-first-piece-social-assets.py`. It preserves the review copies and writes a separate release set. Current output: seven 1080×1350 LinkedIn pages, a tagged seven-page PDF, and six 1600×900 X cards. Final hashes and live URLs are recorded in RELEASE_2026-09-08.md.

## Publication delivery, 9 September 2026

The approved PDF is served at `/research/before-you-sign-01/briefing.pdf` and linked from the live article. Its downloaded bytes match the approved PDF SHA256. The original seven-page native LinkedIn document was subsequently verified live at https://www.linkedin.com/feed/update/urn:li:ugcPost:7503493067388366849/. This supersedes the earlier file-chooser blocker. Review-copy paths above are historical; the original release PNGs use `output/social/before-you-sign-01-release/`. X publication was not re-verified during the redesign.


## LinkedIn direction adopted 9 September 2026

Follow `LINKEDIN_VISUAL_AND_VOICE_GUIDE.md` for future LinkedIn hooks, typography, imagery and highlights. The prepared nine-page example is `output/pdf/before-you-sign-01-linkedin-v2.pdf` (SHA256 `17824d96c6e02792b1b4d3415165c404e5bb039a003c64931d6c5ac0b50e6d80`). Its nine PNGs, caption, transcript, manifest, original illustrative image and generation prompt are in `output/social/before-you-sign-01-linkedin-v2/`. The editable generator is `scripts/build-linkedin-editorial-v2.py`. This is a future creative reference, not a second publication of the article. See `LINKEDIN_REDESIGN_2026-09-09.md` for verification.
