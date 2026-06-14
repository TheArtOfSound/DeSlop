import assert from "node:assert/strict";
import test from "node:test";
import { formatTextReport } from "./formatter";
import type { AuditReport } from "./types";

test("formats exact match evidence in text reports", () => {
  const report: AuditReport = {
    summary: {
      score: 96,
      filesScanned: 1,
      findingsTotal: 1,
      high: 0,
      medium: 1,
      low: 0
    },
    findings: [
      {
        ruleId: "example-rule",
        label: "Example rule",
        severity: "medium",
        filePath: "landing.md",
        line: 1,
        column: 1,
        endColumn: 12,
        matchedText: "example text",
        excerpt: "example text in a line",
        reason: "The report should show exact evidence.",
        replacementHint: "Keep report output directly actionable."
      }
    ]
  };

  const text = formatTextReport(report);

  assert.equal(text.includes("Match: example text"), true);
  assert.equal(text.includes("Line: example text in a line"), true);
});
