# DeSlop - PRD & Working Memory

## Original problem statement
"ensure and test deslop and that it does 100% what it claims with a supreme ui and ux"

## What DeSlop is
A deterministic static repo scanner (TypeScript) that flags visible evidence software looks
unwired, overclaimed, or unfinished. Surfaces: CLI (npx), GitHub Action, and a static browser
page (index.html + browser-analyzer.js) deployed to GitHub Pages (deslop.imagineqira.com).

## Hard constraints
- Public page (index.html) MUST NOT use border-radius, linear-gradient, radial-gradient, or
  box-shadow (enforced by scripts/verify-public-page.mjs). Flat/sharp anti-slop aesthetic.
- index.html must keep required strings (publicUrl, "Static Repo Scanner", ld+json, og:title,
  twitter:card, llms-full.txt, browser-analyzer.js?v=cdn-fallback-1).
- browser-analyzer.js must keep raw.githubusercontent.com, cdn.jsdelivr.net, getCdnCandidates,
  copyCommandButton.
- Pure static site, no build step for the page. Tests via Node built-in test runner.

## Work done (2026-06-18)
- FIX: `npm run check` ran 0 tests silently (dist/**/*.test.js glob not expanded on Node 20).
  Changed to `node --test dist/*.test.js`. Now runs all 33 tests, all pass.
- FIX: dead-navigation-target rule false-flagged valid in-page anchors (href="#analyze").
  Regex now uses a backreferenced quote so only bare #, javascript:void(0), todo, coming-soon
  match. DeSlop self-scan went from 68 -> 100/100.
- FIX: fileCollector now ignores dist-page build artifacts.
- TEST: added regression test for the dead-nav fix (analyzer.test.ts).
- UI: full redesign of index.html + browser-analyzer.js (forensic-terminal aesthetic, acid-lime
  accent, Archivo + JetBrains Mono, scanline + fade-up motion, animated score gauge/count-up,
  severity-coded finding cards, severity + category filter chips, copy-report-as-markdown,
  copy-result-summary, clean empty state, Enter-to-scan). Self-scan stays 100/100, verify passes.

## Verified claims (all green)
- npm run check (33 tests), npm run verify:page, npm run build:page, npm run verify:page:dist
- CLI: default scan, --json, --min-score, --fail-on, --help
- Browser scan end-to-end against live GitHub repo (34 files) + filters + copy buttons

## Backlog / next
- P1: Add browser-side rules to match CLI parity (CLI has 12 rules; browser has 7) - e.g.
  visible-placeholder, vague-insight-copy, readme-template-intro, fake-api-delay,
  comment-explains-syntax, soft-todo.
- P2: Shareable permalink that pre-fills ?repo= and auto-runs.
- P2: Downloadable JSON report from the browser.
- P3: Per-finding "ignore" suggestion snippet copy.
