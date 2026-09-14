# Security Policy

## Supported versions

Until the first public release, security fixes apply to the current `main` branch. A supported-version table will be added when versioned releases exist.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or exposed credential. After the repository is created, use its **Security → Report a vulnerability** form. The owner must enable GitHub private vulnerability reporting before publication. Include affected versions, reproduction steps, impact, and any suggested mitigation. Avoid including real user data or reusable credentials.

The maintainer should acknowledge a report within five business days, validate impact, prepare a fix privately when appropriate, rotate affected credentials, and publish a coordinated advisory after remediation.

## Scope

Security reports may cover credential leakage, path traversal, unsafe report output, dependency compromise, bypassed release gates, or test behavior that crosses its configured origin. Reports about an application being tested belong to that application's own security process.

The bundled scanner is a focused defense-in-depth check. It does not replace provider-side secret scanning, dependency review, code review, or credential rotation.
