import type { AuditReport, Severity } from "./types";

export type ExitPolicy = {
  failOn: Severity | null;
  minScore: number | null;
};

export function shouldExitWithError(report: AuditReport, policy: ExitPolicy): boolean {
  if (policy.minScore !== null && report.summary.score < policy.minScore) return true;

  if (policy.failOn === "high") return report.summary.high > 0;
  if (policy.failOn === "medium") return report.summary.high + report.summary.medium > 0;
  if (policy.failOn === "low") return report.summary.findingsTotal > 0;

  return false;
}
