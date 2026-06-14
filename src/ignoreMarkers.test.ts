// deslop:ignore-file -- test fixtures intentionally contain flagged wording.
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFiles } from "./analyzer";

test("honors line-level ignores", () => {
  const marker = ["deslop", "ignore-line"].join(":");
  const report = analyzeFiles([
    {
      path: "src/copy.ts",
      content: `const message = 'Something went wrong'; // ${marker}`
    }
  ]);

  assert.equal(report.summary.filesScanned, 1);
  assert.equal(report.summary.findingsTotal, 0);
});
