// deslop:ignore-file -- this file stores phrases the scanner is supposed to catch.
import type { SlopRule } from "./types";

const flags = "gi";

const baseRules = [
  {
    id: "fake-production-claim",
    label: "Fake production claim",
    severity: "high",
    category: "release-hygiene",
    pattern: /\b(production-ready|enterprise-grade|battle-tested|world-class|military-grade|bank-level security)\b/gi,
    reason: "Big maturity claims need proof: tests, deployment evidence, threat model, uptime history, or customer use.",
    replacementHint: "Name the specific guarantee the system actually enforces."
  },
  {
    id: "not-actually-wired",
    label: "Not actually wired",
    severity: "high",
    category: "implementation",
    pattern: /\b(in production this would|in production, this would|replace with real|connect to (a )?real|mock data|simulate api|simulated api|fake api)\b/gi,
    reason: "This says the feature is a demo path, not working software.",
    replacementHint: "Either wire the real path or label the feature as intentionally non-shipping."
  },
  {
    id: "visible-placeholder",
    label: "Visible placeholder",
    severity: "high",
    category: "release-hygiene",
    pattern: /\b(lorem ipsum|john doe|jane doe|acme corp|example@email\.com|example\.com|coming soon|feature coming soon|placeholder content)\b/gi,
    reason: "Visible placeholders make the product look fake and often leak into demos.",
    replacementHint: "Replace with real empty-state behavior, fixture data under tests, or domain-specific copy."
  },
  {
    id: "generic-saas-filler",
    label: "Generic SaaS filler",
    severity: "medium",
    category: "copy",
    pattern: /\b(streamline your workflow|unlock your potential|seamless experience|powerful insights|robust solution|all-in-one platform|take your business to the next level|built for modern teams|transform the way you work|effortlessly manage|intuitive and user-friendly)\b/gi,
    reason: "The phrase could describe almost any app, so it does not prove the product understands its own job.",
    replacementHint: "Use actor + action + object: who does what to which real thing."
  },
  {
    id: "vague-insight-copy",
    label: "Vague insight copy",
    severity: "medium",
    category: "copy",
    pattern: /\b(real-time insights|actionable insights|data-driven decisions|smart automation|intelligent workflows|unified dashboard|dynamic experience|meaningful engagement)\b/gi,
    reason: "Insight language is weak unless it names the exact signal, decision, or state transition.",
    replacementHint: "Name the exact metric, risk, queue, receipt, or failure the screen exposes."
  },
  {
    id: "readme-template-intro",
    label: "Template README intro",
    severity: "medium",
    category: "copy",
    pattern: /\b(a modern,? responsive web application|clean and intuitive dashboard|beautiful and responsive ui|built using modern best practices|modern and responsive)\b/gi,
    reason: "Stack-and-style introductions usually hide the actual product behavior.",
    replacementHint: "Start with the workflow the app changes, then mention stack details later."
  },
  {
    id: "weak-error-message",
    label: "Weak error message",
    severity: "medium",
    category: "ux",
    pattern: /\b(something went wrong|an error occurred|failed to fetch|please try again later|unable to complete request|oops)\b/gi,
    reason: "The user gets no cause, no consequence, and no next step.",
    replacementHint: "Say what failed, why it matters, and what the user can do next."
  },
  {
    id: "fake-api-delay",
    label: "Fake API delay",
    severity: "high",
    category: "implementation",
    pattern: /\bsetTimeout\s*\([^\n]*(setLoading|setSuccess|resolve|mock|simulate|fake)/gi,
    reason: "Artificial delays often hide that the feature is not wired to a real operation.",
    replacementHint: "Replace the delay with the real async boundary or move demo behavior into an explicit fixture."
  },
  {
    id: "unimplemented-branch",
    label: "Unimplemented branch",
    severity: "high",
    category: "implementation",
    pattern: /\bthrow new Error\s*\(\s*["'`](not implemented|todo|coming soon|stub)["'`]\s*\)/gi,
    reason: "The code can reach a branch that admits the product is unfinished.",
    replacementHint: "Implement the branch, remove the route, or fail earlier with a precise user-facing constraint."
  },
  {
    id: "client-only-auth-storage",
    label: "Client-only auth storage",
    severity: "high",
    category: "security",
    pattern: /\b(localStorage|sessionStorage)\.(getItem|setItem)\s*\(\s*["'`](?:[^"'`]*[^a-z0-9])?(token|auth|jwt|session|user|role|password|api[-_]?key|secret)(?:[^a-z0-9][^"'`]*)?["'`]/gi,
    reason: "Auth-like state stored in browser storage is easy to spoof and usually means permissions are not enforced server-side.",
    replacementHint: "Move permission enforcement to the server and treat browser state as display-only."
  },
  {
    id: "dead-navigation-target",
    label: "Dead navigation target",
    severity: "medium",
    category: "implementation",
    pattern: /\b(href|to)=\{?["'`](#|javascript:void\(0\)|todo|coming-soon)["'`]?\}?/gi,
    reason: "A visible navigation element points nowhere, which is a direct fake-completeness signal.",
    replacementHint: "Remove the control, wire the destination, or show a disabled state with a concrete reason."
  },
  {
    id: "debug-log-leftover",
    label: "Debug log leftover",
    severity: "low",
    category: "release-hygiene",
    pattern: /\bconsole\.(log|debug|trace)\s*\(/gi,
    reason: "Loose debug output makes shipped behavior harder to inspect and often leaks implementation details.",
    replacementHint: "Use a named logger with levels, or remove the log before release."
  },
  {
    id: "comment-explains-syntax",
    label: "Comment explains syntax",
    severity: "low",
    category: "release-hygiene",
    pattern: /\/\/\s*(initialize state|set loading to true|set loading to false|fetch data|fetch the data|handle button click|return the component|loop through each|map through each)/gi,
    reason: "The comment explains the programming language instead of the product rule.",
    replacementHint: "Delete it or replace it with the constraint that made the code necessary."
  },
  {
    id: "soft-todo",
    label: "Unresolved work marker",
    severity: "low",
    category: "release-hygiene",
    pattern: /\b(todo|fixme|hack|temporary)\b/gi,
    reason: "Work markers are acceptable during development, but they need ownership before release.",
    replacementHint: "Turn the marker into an issue, a test, or a named non-goal."
  }
] satisfies SlopRule[];

export const slopRules: SlopRule[] = baseRules.map((rule) => ({
  ...rule,
  pattern: new RegExp(rule.pattern.source, flags)
}));
