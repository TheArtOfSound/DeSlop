import type { AuditReport } from "./types";

export function formatTextReport(report: AuditReport): string {
  const { summary } = report;
  const lines = [
    "DeSlop wording audit",
    `Score: ${summary.score}/100`,
    `Files scanned: ${summary.filesScanned}`,
    `Findings: ${summary.findingsTotal} (${summary.high} high, ${summary.medium} medium, ${summary.low} low)`,
    ""
  ];

  if (report.findings.length === 0) {
    lines.push("No wording slop detected by the current rule set.");
    return `${lines.join("\n")}\n`;
  }

  for (const finding of report.findings) {
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.label}`);
    lines.push(`${finding.filePath}:${finding.line}:${finding.column}`);
    lines.push(`  Match: ${finding.matchedText}`);
    lines.push(`  Line: ${finding.excerpt}`);
    lines.push(`  Why it matters: ${finding.reason}`);
    lines.push(`  Fix direction: ${finding.replacementHint}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}
