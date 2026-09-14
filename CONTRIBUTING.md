# Contributing

Thank you for improving WebGame QA Kit.

## Before opening a change

1. Keep the toolkit framework-independent and useful outside one application.
2. Use synthetic fixtures. Never submit production saves, account data, service endpoints, tokens, or proprietary assets.
3. Add a focused test for behavior that can regress.
4. Keep secret-scanner output redacted.

## Local workflow

```sh
npm install
npx playwright install chromium
npm run ci
```

Changes should pass the complete command before review. Keep pull requests small enough to explain the problem, resulting behavior, and validation clearly.

## Commit and review guidance

- Use descriptive commits in imperative form.
- Explain observable behavior and material tradeoffs.
- Update README examples when public APIs change.
- Do not weaken a gate only to make a failing check pass.
- Confirm that generated reports and local environment files remain untracked.

By contributing, you agree that your contribution is licensed under Apache License 2.0.
