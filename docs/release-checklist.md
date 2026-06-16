# Release checklist

Use this before treating a DeSlop change as ready.

## Local checks

```bash
npm install
npm run check
npm run verify:page
npm run build:page
npm run verify:page:dist
npm run audit -- . --min-score 100
```

## Public page checks

```bash
open index.html
```

Confirm:

- layout is flat and square
- no gradients, glows, or rounded cards
- commands are visible without scrolling on desktop
- repository link opens the GitHub repo
- deploy link opens the Pages workflow runs
- verification table lists the source, artifact, workflow, and crawler files

## GitHub checks

- `Verify DeSlop` workflow passes
- `Deploy static DeSlop page` workflow passes
- Pages URL opens after deployment

Public URL:

```txt
https://theartofsound.github.io/DeSlop/
```
