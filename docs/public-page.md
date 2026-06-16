# Public page design constraints

The DeSlop public page should look like a developer tool page, not a generated SaaS landing page.

## Required direction

- flat layout
- square panels
- plain dark background
- restrained typography
- command-first structure
- visible verification details
- direct links to repo and deployment runs

## Avoid

- rounded cards
- gradient backgrounds
- glow effects
- fake dashboard decoration
- inflated product claims
- vague marketing language

## Verification

The public page verifier rejects common drift back into generated landing-page styling by checking `index.html` for forbidden CSS tokens before deployment.

Run:

```bash
npm run verify:page
npm run build:page
npm run verify:page:dist
```
