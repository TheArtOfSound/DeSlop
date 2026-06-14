# DeSlop

DeSlop scans a repo for wording and code residue that makes generated software feel fake: placeholders, vague product copy, fake maturity claims, weak error messages, syntax-comments, and unresolved work markers.

The first version is a command line audit. It does not pretend to judge whether code was written by a person or a model. It judges whether the repo contains signals that make the product look unwired, overclaimed, or unfinished.

## Current audit scope

DeSlop flags:

- visible placeholders such as demo names, filler domains, and launch-page leftovers
- phrases that claim maturity without evidence
- copy that describes no actor, object, state, or consequence
- error messages that do not tell the user what failed
- comments that explain syntax instead of product constraints
- work markers that need an owner before release

## Run it

```bash
npm install
npm run audit -- .
```

Scan a specific path:

```bash
npm run audit -- README.md
```

Return JSON:

```bash
npm run audit -- . --json
```

Fail CI when high-severity findings exist:

```bash
npm run audit -- . --fail-on high
```

## Development checks

```bash
npm run check
```

## Scoring

The score starts at 100.

- high finding: -8
- medium finding: -4
- low finding: -1

The score is not a truth score. It is a pressure gauge. A clean score means the current rules did not find wording slop; it does not mean the product is complete.

## Design rule

DeSlop should accuse vague software precisely. A finding needs a file, line, reason, and fix direction. If a rule cannot explain why it matters, the rule does not belong yet.
