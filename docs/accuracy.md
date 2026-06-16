# Accuracy model

DeSlop is a deterministic static scanner. It is not a proof system and it should not claim perfect detection.

## What accuracy means here

A useful DeSlop finding should include:

- exact file path
- line number
- matched text
- severity
- category
- reason the evidence matters
- direction for fixing it

The scanner is considered better when it produces fewer vague findings and more findings that a developer can act on immediately.

## What the benchmark covers

`src/accuracyBenchmark.test.ts` covers these repo shapes:

- clean service repo
- slop-heavy launch repo
- mixed frontend residue
- docs-only concrete repo
- unimplemented backend branch

The benchmark checks severity counts, category counts, expected rule ids, and whether each finding has a non-empty reason and fix direction.

## Known limits

- It can miss issues that do not match a current rule.
- It can flag intentional examples unless files or lines are ignored.
- Browser mode only scans public GitHub repos.
- Browser mode caps file count and file size.
- CLI mode is the deeper path for local, private, or large repos.
- A clean score does not prove the product is complete.

## Correct claim

Good: DeSlop reports visible repo evidence that often makes software look unwired, overclaimed, or unfinished.

Bad: DeSlop is 100% accurate or proves whether a product is complete.
