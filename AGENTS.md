<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product delivery priorities

Oday's standing direction, adopted 20 September 2026: prioritize simplicity, ease of use, clarity and good UX/UI in every frontend release. Start from the user's task, make the result and next action clear, and reveal supporting detail progressively. Preserve accessible keyboard use, readable mobile layouts and explicit loading, empty, error and unknown states.

Backend security and data hygiene are paramount. Derive identity and tenant scope server-side, enforce authorization on every read/write/export, validate inputs and record relationships, minimize retained data, and preserve source/version provenance. Keep missing evidence distinct from negative findings. Treat proposed controls as requirements until implementation and relevant negative checks verify them.
