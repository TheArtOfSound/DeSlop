// deslop:ignore-file -- benchmark fixtures intentionally construct flagged and clean examples.
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFiles } from "./analyzer";
import type { FileInput, RuleCategory } from "./types";

type ExpectedCounts = {
  high: number;
  medium: number;
  low: number;
  categories: Partial<Record<RuleCategory, number>>;
  ruleIds?: string[];
};

type BenchmarkCase = {
  name: string;
  files: FileInput[];
  expected: ExpectedCounts;
};

const join = (parts: string[]): string => parts.join("");

const benchmarkCases: BenchmarkCase[] = [
  {
    name: "clean service repo",
    files: [
      {
        path: "README.md",
        content: [
          "Customers request pickups.",
          "Dispatchers assign stops to workers.",
          "Workers upload proof before payout.",
          "Admins review failed proof with a reason code."
        ].join("\n")
      }
    ],
    expected: { high: 0, medium: 0, low: 0, categories: {} }
  },
  {
    name: "slop heavy launch repo",
    files: [
      {
        path: "README.md",
        content: [
          join(["production", "-ready"]),
          join(["all-in-one", " platform"]),
          join(["coming", " soon"]),
          join(["john", " doe"]),
          join(["something", " went wrong"])
        ].join("\n")
      }
    ],
    expected: {
      high: 3,
      medium: 2,
      low: 0,
      categories: { copy: 1, ux: 1, "release-hygiene": 3 },
      ruleIds: ["fake-production-claim", "generic-saas-filler", "visible-placeholder", "weak-error-message"]
    }
  },
  {
    name: "mixed frontend residue",
    files: [
      {
        path: "src/App.tsx",
        content: [
          join(["local", "Storage.setItem('token', 'abc')"]),
          join(["set", "Timeout(() => setSuccess(true), 800);"]),
          join(["<a href=\"", "#\">Billing</a>"]),
          join(["console.", "log('debug')"])
        ].join("\n")
      }
    ],
    expected: {
      high: 2,
      medium: 1,
      low: 1,
      categories: { security: 1, implementation: 2, "release-hygiene": 1 },
      ruleIds: ["client-only-auth-storage", "fake-api-delay", "dead-navigation-target", "debug-log-leftover"]
    }
  },
  {
    name: "docs only concrete repo",
    files: [
      {
        path: "docs/ops.md",
        content: [
          "Support agents see disputed charge amount, order id, customer note, and processor status.",
          "A refund cannot be submitted until the processor status is settled.",
          "If the processor rejects the request, the agent sees the processor code and retry window."
        ].join("\n")
      }
    ],
    expected: { high: 0, medium: 0, low: 0, categories: {} }
  },
  {
    name: "markdown code examples can use console logging",
    files: [
      {
        path: "clients/js/README.md",
        content: [
          "```js",
          join(["console.", "log(result)"]),
          "```"
        ].join("\n")
      }
    ],
    expected: { high: 0, medium: 0, low: 0, categories: {} }
  },
  {
    name: "html pre examples can use console logging",
    files: [
      {
        path: "site/index.html",
        content: [
          "<pre>",
          join(["console.", "log(result)"]),
          "</pre>"
        ].join("\n")
      }
    ],
    expected: { high: 0, medium: 0, low: 0, categories: {} }
  },
  {
    name: "preference storage is not auth storage",
    files: [
      {
        path: "src/settings.ts",
        content: [
          join(["local", "Storage.setItem('lolm_dataset', selected)"]),
          join(["local", "Storage.setItem('lolm_tokenizer', tokenizer)"])
        ].join("\n")
      }
    ],
    expected: { high: 0, medium: 0, low: 0, categories: {} }
  },
  {
    name: "password storage is auth storage",
    files: [
      {
        path: "src/auth.ts",
        content: join(["local", "Storage.setItem('lolm_password', password)"])
      }
    ],
    expected: {
      high: 1,
      medium: 0,
      low: 0,
      categories: { security: 1 },
      ruleIds: ["client-only-auth-storage"]
    }
  },
  {
    name: "unimplemented backend branch",
    files: [
      {
        path: "src/billing.ts",
        content: join(["throw new Error('", "not implemented", "');"])
      }
    ],
    expected: {
      high: 1,
      medium: 0,
      low: 0,
      categories: { implementation: 1 },
      ruleIds: ["unimplemented-branch"]
    }
  }
];

for (const benchmark of benchmarkCases) {
  test(`accuracy benchmark: ${benchmark.name}`, () => {
    const report = analyzeFiles(benchmark.files);

    assert.equal(report.summary.high, benchmark.expected.high);
    assert.equal(report.summary.medium, benchmark.expected.medium);
    assert.equal(report.summary.low, benchmark.expected.low);

    for (const [category, expectedCount] of Object.entries(benchmark.expected.categories)) {
      assert.equal(report.summary.byCategory[category as RuleCategory], expectedCount);
    }

    if (benchmark.expected.ruleIds) {
      const actual = new Set(report.findings.map((finding) => finding.ruleId));
      for (const ruleId of benchmark.expected.ruleIds) {
        assert.equal(actual.has(ruleId), true, `missing ${ruleId}`);
      }
    }

    for (const finding of report.findings) {
      assert.ok(finding.reason.length >= 24);
      assert.ok(finding.replacementHint.length >= 24);
      assert.notEqual(finding.reason, finding.replacementHint);
    }
  });
}
