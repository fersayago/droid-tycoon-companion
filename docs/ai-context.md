# AI context

This app is a local-first tracker for Fortnite Droid Tycoon.

## Current MVP

- One Next.js page.
- Left side: owned Droidex table with one row per non-Iconic droid and one radio-button column per variant.
- Right side: reset/rebirth requirements by level with coverage details and next-use context.
- Header controls: selected rebirth and current level.
- Browser `localStorage` stores all user progress.

## Do not overcomplicate

Avoid introducing these unless explicitly requested:

- Database.
- Auth.
- Server actions.
- Cloud sync.
- External Fortnite APIs.
- Runtime Excel parsing in the browser.
- Droid type logic.

## Data maintenance

The generated TypeScript data should stay deterministic and auditable. If the workbook changes, regenerate the static data and verify:

- No Iconic droids in the inventory table data.
- No missing droid references for requirements.
- 4 rebirth paths.
- 27 levels per path.
- 3 requirements per level.
