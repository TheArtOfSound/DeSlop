# DeSlop

[![Public page](https://img.shields.io/badge/public_page-deslop.imagineqira.com-f2f2f2?style=flat-square)](https://deslop.imagineqira.com/)
[![Repo](https://img.shields.io/badge/GitHub-TheArtOfSound%2FDeSlop-f2f2f2?style=flat-square&logo=github)](https://github.com/TheArtOfSound/DeSlop)
[![CLI](https://img.shields.io/badge/CLI-npx%20github%3ATheArtOfSound%2FDeSlop-f2f2f2?style=flat-square)](#cli-use)
[![Schema](https://img.shields.io/badge/report_schema-v1-f2f2f2?style=flat-square)](#json-output)

DeSlop is a deterministic repo scanner for visible evidence that software looks unwired, overclaimed, unfinished, or harder to trust. It reports exact files, lines, matched text, reasons, severity, and fix direction.

It is not an authorship detector. It does not decide whether code came from a person or a model. It checks the repo evidence a reviewer, user, investor, or maintainer would see.

## Quick links

| Destination | Link |
| --- | --- |
| Browser scanner | https://deslop.imagineqira.com/ |
| GitHub repo | https://github.com/TheArtOfSound/DeSlop |
| Usage guide | https://deslop.imagineqira.com/USAGE.md |
| LLM summary | https://deslop.imagineqira.com/llms.txt |
| Full LLM context | https://deslop.imagineqira.com/llms-full.txt |
| Status contract | https://deslop.imagineqira.com/status.json |
| Sitemap | https://deslop.imagineqira.com/sitemap.xml |

## Recommended GitHub About settings

Use these in the repository sidebar so GitHub search and visitors understand the project quickly.

```txt
Description:
Static repo scanner for fake completeness, vague product copy, weak errors, dead links, client-side auth signals, and unfinished code paths.

Website:
https://deslop.imagineqira.com/

Topics:
static-analysis, repo-scanner, github-actions, cli-tool, code-audit, quality-gate, product-copy, security-review, developer-tools, ai-code-review
```

## Fastest use: browser UI

Open the public page, paste a public GitHub repo URL, and click Analyze:

```txt
https://deslop.imagineqira.com/
```

Browser mode is best for a quick first pass on public repos. It scans capped public files from GitHub, falls back to a public CDN when anonymous GitHub API access is rate limited, and shows score, severity counts, files, lines, matched text, reasons, and fix direction.

## CLI use

From inside any repo you want to check:

```bash
npx -y github:TheArtOfSound/DeSlop -- .
```

Fail if the repo scores below 90:

```bash
npx -y github:TheArtOfSound/DeSlop -- . --min-score 90
```

Return JSON:

```bash
npx -y github:TheArtOfSound/DeSlop -- . --json
```

## Use in GitHub Actions

Create this workflow in the repo you want to check:

```yaml
name: DeSlop

on:
  pull_request:
  workflow_dispatch:

jobs:
  deslop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: TheArtOfSound/DeSlop@main
        with:
          path: .
          min-score: "90"
```

## What DeSlop checks

DeSlop flags:

- visible release-path fixtures and generic demo residue
- maturity claims that lack tests, deployment evidence, threat model, uptime history, or customer evidence
- copy that does not name an actor, object, state, or consequence
- error messages that do not tell the user what failed
- artificial demo behavior hiding a missing async boundary
- reachable unimplemented branches
- browser-side auth-like state that can imply missing server enforcement
- navigation elements that point nowhere
- loose debug output in shipped app code
- syntax-level comments that do not explain a product constraint
- work markers that need ownership before release

## Why it exists

AI-assisted software can look complete before the implementation is actually trustworthy. DeSlop gives a blunt review pass that points to concrete repo evidence instead of giving a vague vibe score.

Useful review questions:

- Is the page making a claim the repo does not prove?
- Is the user clicking a control that has no destination?
- Is auth-like state treated as browser truth?
- Is the error message specific enough to act on?
- Is a demo path pretending to be a release path?

## Public index

The repo includes a static `index.html` landing page and a GitHub Actions Pages workflow. The workflow verifies source files, builds `dist-page`, verifies the artifact, then deploys only that artifact folder.

Open it locally:

```bash
open index.html
```

Public page target:

```txt
https://deslop.imagineqira.com/
```

GitHub Pages should use this source setting:

```txt
Source: GitHub Actions
```

Verify the committed public page files:

```bash
npm run verify:page
```

Build and verify the deploy artifact:

```bash
npm run build:page
npm run verify:page:dist
```

## Local development

```bash
npm install
npm run audit -- .
npm run check
```

Scan a specific path:

```bash
npm run audit -- README.md
```

Fail when high-severity findings exist:

```bash
npm run audit -- . --fail-on high
```

Limit the largest file DeSlop will read:

```bash
npm run audit -- . --max-file-bytes 250000
```

## JSON output

JSON reports include `schemaVersion: 1`, summary counts, category counts, and exact finding evidence: file, line, column, matched text, reason, and fix direction.

## Scan limits

By default, DeSlop skips supported files larger than 1,000,000 bytes. Use `--max-file-bytes` to lower or raise that limit for CI and large repos.

## Ignore markers

A file can opt out with this marker:

```txt
deslop:ignore-file
```

A single line can opt out with this marker:

```txt
deslop:ignore-line
```

Use ignores for rule catalogs, fixtures, snapshots, or generated files that intentionally contain flagged text. Do not use them to hide release-path product code.

## Scoring

The score starts at 100.

- high finding: -8
- medium finding: -4
- low finding: -1

The score is not a truth score. It is a pressure gauge. A clean score means the current rules did not find the configured evidence patterns; it does not mean the product is complete.

## Design rule

DeSlop should accuse vague software precisely. A finding needs a file, line, reason, and fix direction. If a rule cannot explain why it matters, the rule does not belong yet.
