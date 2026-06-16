# Using DeSlop

DeSlop is for checking a repo before you show it to users, reviewers, customers, or investors.

It looks for visible signs that a project is not really wired yet: vague copy, placeholder residue, weak errors, dead links, fake async behavior, unfinished branches, debug logs, and browser-only trust state.

## Browser UI

Open:

```txt
https://theartofsound.github.io/DeSlop/
```

Paste a public GitHub repo URL and click Analyze.

Browser mode is the easiest first pass. It scans capped public files directly from GitHub and shows score, severity counts, files, lines, matched text, reasons, and fix direction.

## One command

Run this from inside the repo you want to check:

```bash
npx -y github:TheArtOfSound/DeSlop -- .
```

## Stricter check

Fail the command if the score is below 90:

```bash
npx -y github:TheArtOfSound/DeSlop -- . --min-score 90
```

Fail on high-severity findings:

```bash
npx -y github:TheArtOfSound/DeSlop -- . --fail-on high
```

## JSON output

```bash
npx -y github:TheArtOfSound/DeSlop -- . --json
```

Use JSON when another tool, dashboard, CI job, or agent needs to read the result.

## GitHub Actions

Add this to the repo you want to check:

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

## Reading results

A finding is useful when it tells you:

- file
- line
- matched text
- why it matters
- how to fix the direction

A clean score means the current rules did not find DeSlop signals. It does not prove the product is complete.
