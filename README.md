# WebGame QA Kit

WebGame QA Kit is a small, framework-independent release gate for browser games and stateful web applications. It combines repeatable browser checks, save-file validation, responsive layout assertions, state regression comparisons, and redacted secret scanning in one local command-line workflow.

The project is a clean-room, synthetic toolkit. Its demo contains fictional data, no production assets, no service credentials, and no dependency on a private application.

## Why it exists

Browser games often fail at the seams between otherwise healthy systems: a route works at desktop width but clips on mobile, a save reloads until its schema changes, a card slips outside the viewport, or a release artifact accidentally contains a credential. General test runners can detect each problem, but teams still need a compact and reviewable release report.

WebGame QA Kit turns those checks into a pass/fail gate that can run locally and in CI.

## Included checks

- Route loading, same-origin HTTP failures, page errors, and readiness selectors
- Click-through navigation with expected paths
- Horizontal overflow and card-boundary checks across named viewports
- JSON save schema, required paths, size, finite-number, and round-trip checks
- Explicit sequential save migrations
- Deterministic nested-state regression comparisons
- Worktree and Git-history credential pattern scans with redacted output
- A release-gate helper that requires every selected check to pass
- A responsive synthetic demo with dashboard, inventory, navigation, local save state, and malformed-state recovery

## Requirements

- Node.js 22 or newer
- npm
- Chromium installed through Playwright

## Install and validate

```sh
npm install
npx playwright install chromium
npm run ci
```

`npm run ci` runs linting, JavaScript type checking, syntax checks, unit tests, Playwright tests, both secret scans, the package build, and a standalone validation of the example application.

## First browser audit

Create `webgame-qa.config.mjs`:

```js
export default {
  baseUrl: "http://127.0.0.1:3000",
  viewports: [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 900 }
  ],
  routes: [
    { name: "home", path: "/", readySelector: "main" },
    { name: "inventory", path: "/inventory", readySelector: "[data-view='inventory']" }
  ],
  navigation: [
    {
      name: "inventory link",
      selector: "[data-nav='inventory']",
      expectedPath: "/inventory",
      readySelector: "[data-view='inventory']"
    }
  ],
  cardSelector: "[data-qa-card]",
  outputDir: ".qa-output"
};
```

Run the target app, then execute:

```sh
npx webgame-qa audit webgame-qa.config.mjs
```

The command writes a JSON report to `.qa-output/browser-audit.json` and exits with a nonzero status when any check fails.

## Save integrity

```js
import { migrateSave, roundTripSave, validateSave } from "webgame-qa-kit";

const schema = {
  version: 2,
  requiredPaths: ["player.id", "resources.energy", "inventory"],
  maxBytes: 500_000
};

const validation = validateSave(candidateSave, schema);
const roundTrip = roundTripSave(candidateSave);
const migrated = migrateSave(oldSave, 2, {
  2: (save) => ({ ...save, resources: { energy: 10 } })
});
```

Migrations are supplied by the consumer. The toolkit never guesses how application state should change.

## State regression

```js
import { compareSnapshots } from "webgame-qa-kit";

const result = compareSnapshots(before, after, {
  ignore: ["session.lastSeenAt"]
});
```

Changed nested paths are returned in stable order so reports are easy to review.

## Secret scanning

```sh
npx webgame-qa secrets . --output .qa-output/secret-scan.json
npm run security:history
```

The worktree scanner and Git-history scanner use separate implementations. Reports include the file, line when available, detector category, and `SECRET DETECTED — REDACTED`; they do not echo matched values. These lightweight checks complement a mature security scanner rather than replace one.

## Demo

```sh
node examples/demo/server.mjs
```

Open `http://127.0.0.1:4173`. The demo is deliberately small but exercises routing, responsive cards, browser storage, reload persistence, save reset, and malformed-state recovery. Its audit configuration is in `examples/demo/qa.config.mjs`.

## Project structure

```text
src/                     Public library and CLI
tests/unit/              Save, regression, config, gate, and scanner tests
tests/browser/           Navigation, reload, and viewport tests
examples/demo/           Self-contained synthetic application
scripts/                 Build, syntax, example, and history checks
.github/workflows/       Reproducible CI gate
```

## Configuration notes

- `baseUrl` must use HTTP or HTTPS.
- Routes must begin with `/` and may include a query or hash.
- `readySelector` is optional and should identify stable loaded content.
- `cardSelector` defaults to `[data-qa-card]`.
- Browser `channel` or `executablePath` can be supplied for local environments.
- Generated reports belong in `.qa-output`, which is ignored by Git.

## Security and privacy

Use synthetic fixtures. Do not commit customer saves, access tokens, session exports, production URLs, or screenshots containing personal information. See [SECURITY.md](SECURITY.md) for private reporting guidance.

## Roadmap

- Pluggable save-schema adapters
- Optional screenshot-diff integration
- Machine-readable SARIF output for secret findings
- Multi-page application navigation presets
- Accessibility assertions that fit the same release report

## License and contributions

WebGame QA Kit is licensed under Apache License 2.0. Contributions are welcome after the local candidate completes owner security review; see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
