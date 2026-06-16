# DeSlop

DeSlop scans a repo for wording and code residue that makes generated software feel fake: placeholders, vague product copy, fake maturity claims, weak error messages, fake async behavior, dead navigation, browser-only permission state, syntax-comments, and unresolved work markers.

It does not pretend to judge whether code was written by a person or a model. It judges whether the repo contains signals that make the product look unwired, overclaimed, or unfinished.

## Fastest use: browser UI

Open the public page, paste a public GitHub repo URL, and click Analyze:

```txt
https://theartofsound.github.io/DeSlop/
```

Browser mode is best for a quick first pass on public repos. It scans capped public files directly from GitHub and shows score, severity counts, files, lines, matched text, reasons, and fix direction.

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

Create `.github/workflows/deslop.yml` in the repo you want to check:

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

## Current audit scope

DeSlop flags:

- visible placeholders such as demo names, filler domains, and launch-page leftovers
- phrases that claim maturity without evidence
- copy that describes no actor, object, state, or consequence
- error messages that do not tell the user what failed
- artificial async delays used as demo behavior
- reachable unimplemented branches
- browser-only permission state that implies missing server enforcement
- navigation elements that point nowhere
- loose debug logs in scanned files
- comments that explain syntax instead of product constraints
- work markers that need an owner before release

## Public index

The repo includes a static `index.html` landing page and a GitHub Actions Pages workflow. The workflow verifies source files, builds `dist-page`, verifies the artifact, then deploys only that artifact folder.

Open it locally:

```bash
open index.html
```

Public page target:

```txt
https://theartofsound.github.io/DeSlop/
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

## File-level ignores

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

The score is not a truth score. It is a pressure gauge. A clean score means the current rules did not find wording slop; it does not mean the product is complete.

## Design rule

DeSlop should accuse vague software precisely. A finding needs a file, line, reason, and fix direction. If a rule cannot explain why it matters, the rule does not belong yet.
