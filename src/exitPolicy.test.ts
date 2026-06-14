import assert from "node:assert/strict";
import test from "node:test";
import { shouldExitWithError } from "./exitPolicy";
import type { AuditReport } from "./types";

function report(score: number, high: number, medium: number, low: number): AuditReport {
  return {
    schemaVersion: 1,
    summary: {
      score,
      filesScanned: 1,
      findingsTotal: high + medium + low,
      high,
      medium,
      low,
      byCategory: {
        copy: 0,
        ux: 0,
        implementation: 0,
        security: 0,
        "release-hygiene": 0
      }
    },
    findings: []
  };
}

test("exits with error when high severity findings are present", () => {
  assert.equal(shouldExitWithError(report(92, 1, 0, 0), { failOn: "high", minScore: null }), true);
  assert.equal(shouldExitWithError(report(96, 0, 1, 0), { failOn: "high", minScore: null }), false);
});

test("exits with error when score is below the configured minimum", () => {
  assert.equal(shouldExitWithError(report(89, 0, 0, 0), { failOn: null, minScore: 90 }), true);
  assert.equal(shouldExitWithError(report(90, 0, 0, 0), { failOn: null, minScore: 90 }), false);
});

test("does not exit with error when no threshold is configured", () => {
  assert.equal(shouldExitWithError(report(0, 0, 0, 0), { failOn: null, minScore: null }), false);
});
