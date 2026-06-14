// deslop:ignore-file -- test fixtures intentionally contain flagged wording.
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFiles } from "./analyzer";

test("flags visible placeholders and fake wiring language", () => {
  const report = analyzeFiles([
    {
      path: "README.md",
      content: "In production this would handle data for John Doe."
    }
  ]);

  assert.equal(report.summary.filesScanned, 1);
  assert.equal(report.summary.high, 2);
  assert.equal(report.findings[0]?.severity, "high");
});

test("keeps concrete product wording clean", () => {
  const report = analyzeFiles([
    {
      path: "README.md",
      content: "Customers book pickups. Workers complete stops. Admins verify proof before payout."
    }
  ]);

  assert.equal(report.summary.findingsTotal, 0);
  assert.equal(report.summary.score, 100);
});

test("flags fake-complete code residue", () => {
  const report = analyzeFiles([
    {
      path: "src/BillingLink.tsx",
      content: [
        "setTimeout(() => setSuccess(true), 1000);",
        "<a href=\"#\">Billing</a>",
        "throw new Error(\"stub\");",
        "console.log(result);"
      ].join("\n")
    }
  ]);

  assert.equal(report.summary.high, 2);
  assert.equal(report.summary.medium, 1);
  assert.equal(report.summary.low, 1);
});

test("honors the file-level ignore marker", () => {
  const report = analyzeFiles([
    {
      path: "fixtures/bad-copy.md",
      content: "// deslop:ignore-file\nSomething went wrong"
    }
  ]);

  assert.equal(report.summary.filesScanned, 0);
  assert.equal(report.summary.findingsTotal, 0);
});

test("reports exact match location", () => {
  const report = analyzeFiles([
    {
      path: "app.tsx",
      content: "const copy = 'ok';\nconst error = 'Something went wrong';"
    }
  ]);

  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0]?.line, 2);
  assert.equal(report.findings[0]?.column, 16);
  assert.equal(report.findings[0]?.endColumn, 36);
  assert.equal(report.findings[0]?.matchedText, "Something went wrong");
});
