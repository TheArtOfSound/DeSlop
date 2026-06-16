# Repo testing matrix

Use this matrix when changing rules or the browser analyzer.

## Deterministic fixtures

These must stay covered by automated tests:

| Repo shape | Expected behavior |
| --- | --- |
| Clean service repo | No findings, score 100 |
| Slop-heavy launch repo | High and medium findings with specific evidence |
| Mixed frontend residue | Security, implementation, navigation, and release-hygiene findings |
| Docs-only concrete repo | No findings when wording is specific and operational |
| Unimplemented backend branch | High implementation finding |

## Public repo smoke tests

Use public repos only for smoke tests, not fixed accuracy claims. Public repos change over time.

Suggested mix:

| Repo type | What to watch |
| --- | --- |
| mature library | Should avoid noisy marketing findings |
| documentation-heavy project | Should catch vague docs only when wording is truly generic |
| frontend demo app | Should catch dead links, weak errors, debug output, placeholder data |
| full-stack app | Should catch browser-only trust state and unfinished branches |
| generated template repo | Should catch template copy and visible placeholders |

## Browser UI smoke path

1. Open the public page.
2. Paste a public GitHub repo URL.
3. Click Analyze.
4. Confirm progress text changes while files load.
5. Confirm score, file count, severity count, and findings render.
6. Confirm each finding includes file, line, matched text, reason, and fix direction.
7. Confirm the CLI fallback command copies.

## Accuracy rule

Do not tune rules to make a single public repo look good. Tune rules only when the finding is explainable across repo types and remains actionable.
