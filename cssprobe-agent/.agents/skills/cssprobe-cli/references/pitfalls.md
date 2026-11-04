# cssprobe-cli Pitfalls & Boundaries

## Browser Installation

- cssprobe-cli uses `playwright-core` (not `playwright`). Browsers must be installed separately:
  `npx playwright install chromium`
- On macOS, Chromium is cached at `~/Library/Caches/ms-playwright/chromium-*`.
- cssprobe-cli auto-discovers existing Chromium installations in the Playwright cache.

## Cross-origin Stylesheets

- Browser security blocks `cssRules` access on cross-origin stylesheets (CDN, third-party CSS).
- Declared values from blocked sheets are marked `UNVERIFIABLE`.
- Computed values from `getComputedStyle()` are always accurate (not affected by CORS).
- The report header shows: `⚠ N stylesheet(s) blocked by browser security`.

## Selector Not Found

- If `cssprobe-cli inspect <selector>` returns `Not found: <selector>`,
  the element doesn't exist in the DOM at page load.
- For SPAs that load content dynamically, use `--headed` to see what's on the page.

## Login State

- State files contain cookies and localStorage -- treat them as secrets.
- Cookies may expire -- re-import or re-login if inspection returns unexpected results.
- `state-import` expects Netscape cookie format (tab-separated).
  Browser extensions like "EditThisCookie" or "Cookie Editor" can export in this format.

## Viewport Overflow Flags

- `⚠viewport-overflow` means the element's rect extends beyond the viewport.
- For elements below the fold on scrolling pages, this is expected -- not a bug.
- Focus on `⚠parent-overflow` and `⚠overflow(N>M)but-overflow=visible` for real issues.

## Confidence Levels

- `DEFINITE`: based on computed values (facts) or accessible declared values.
- `INDEFINITE`: declared value uses `%` -- resolves at runtime.
- `UNVERIFIABLE`: declared value missing or from blocked stylesheet.
- When all ancestors have `UNVERIFIABLE` height declarations, the anchor check
  reports `UNVERIFIABLE` -- this means we can't prove whether an anchor exists.

## JSON Output

- Pass `--json` AFTER the command name: `cssprobe-cli inspect body --json`.
- In JSON mode, errors are `{ "isError": true, "error": "message" }` and the
  process exits with code 1. Check for `isError` before parsing results.

## Config

- Config file: `~/.cssprobe-clirc` (JSON). Use `config-path` to confirm.
- Priority: CLI flags > env vars (`CSSPROBE_BROWSER`, `CSSPROBE_DEPTH`,
  `CSSPROBE_HEADED`) > config file.
