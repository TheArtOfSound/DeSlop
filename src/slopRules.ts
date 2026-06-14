// deslop:ignore-file -- this file stores phrases the scanner is supposed to catch.
import type { SlopRule } from "./types";

const flags = "gi";

const baseRules = [
  {
    id: "fake-production-claim",
    label: "Fake production claim",
    severity: "high",
    pattern: /\b(production-ready|enterprise-grade|battle-tested|world-class|military-grade|bank-level security)\b/gi,
    reason: "Big maturity claims need proof: tests, deployment evidence, threat model, uptime history, or customer use.",
    replacementHint: "Name the specific guarantee the system actually enforces."
  },
  {
    id: "not-actually-wired",
    label: "Not actually wired",
    severity: "high",
    pattern: /\b(in production this would|in production, this would|replace with real|connect to (a )?real|mock data|simulate api|simulated api|fake api)\b/gi,
    reason: "This says the feature is a demo path, not working software.",
    replacementHint: "Either wire the real path or label the feature as intentionally non-shipping."
  },
  {
    id: "visible-placeholder",
    label: "Visible placeholder",
    severity: "high",
    pattern: /\b(lorem ipsum|john doe|jane doe|acme corp|example@email\.com|example\.com|coming soon|feature coming soon|placeholder content)\b/gi,
    reason: "Visible placeholders make the product look fake and often leak into demos.",
    replacementHint: "Replace with real empty-state behavior, fixture data under tests, or domain-specific copy."
  },
  {
    id: "generic-saas-filler",
    label: "Generic SaaS filler",
    severity: "medium",
    pattern: /\b(streamline your workflow|unlock your potential|seamless experience|powerful insights|robust solution|all-in-one platform|take your business to the next level|built for modern teams|transform the way you work|effortlessly manage|intuitive and user-friendly)\b/gi,
    reason: "The phrase could describe almost any app, so it does not prove the product understands its own job.",
    replacementHint: "Use actor + action + object: who does what to which real thing."
  },
  {
    id: "vague-insight-copy",
    label: "Vague insight copy",
    severity: "medium",
    pattern: /\b(real-time insights|actionable insights|data-driven decisions|smart automation|intelligent workflows|unified dashboard|dynamic experience|meaningful engagement)\b/gi,
    reason: "Insight language is weak unless it names the exact signal, decision, or state transition.",
    replacementHint: "Name the exact metric, risk, queue, receipt, or failure the screen exposes."
  },
  {
    id: "readme-template-intro",
    label: "Template README intro",
    severity: "medium",
    pattern: /\b(a modern,? responsive web application|clean and intuitive dashboard|beautiful and responsive ui|built using modern best practices|modern and responsive)\b/gi,
    reason: "Stack-and-style introductions usually hide the actual product behavior.",
    replacementHint: "Start with the workflow the app changes, then mention stack details later."
  },
  {
    id: "weak-error-message",
    label: "Weak error message",
    severity: "medium",
    pattern: /\b(something went wrong|an error occurred|failed to fetch|please try again later|unable to complete request|oops)\b/gi,
    reason: "The user gets no cause, no consequence, and no next step.",
    replacementHint: "Say what failed, why it matters, and what the user can do next."
  },
  {
    id: "comment-explains-syntax",
    label: "Comment explains syntax",
    severity: "low",
    pattern: /\/\/\s*(initialize state|set loading to true|set loading to false|fetch data|fetch the data|handle button click|return the component|loop through each|map through each)/gi,
    reason: "The comment explains the programming language instead of the product rule.",
    replacementHint: "Delete it or replace it with the constraint that made the code necessary."
  },
  {
    id: "soft-todo",
    label: "Unresolved work marker",
    severity: "low",
    pattern: /\b(todo|fixme|hack|temporary)\b/gi,
    reason: "Work markers are acceptable during development, but they need ownership before release.",
    replacementHint: "Turn the marker into an issue, a test, or a named non-goal."
  }
] satisfies SlopRule[];

export const slopRules: SlopRule[] = baseRules.map((rule) => ({
  ...rule,
  pattern: new RegExp(rule.pattern.source, flags)
}));
