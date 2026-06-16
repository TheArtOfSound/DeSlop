import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const baseDir = process.argv[2] ?? ".";
const publicUrl = "https://deslop.imagineqira.com/";
const sourceChecks = baseDir === "." ? [
  {
    file: ".github/workflows/pages.yml",
    includes: [
      "actions/configure-pages@v5",
      "actions/upload-pages-artifact@v3",
      "actions/deploy-pages@v4"
    ]
  },
  {
    file: "docs/public-page.md",
    includes: [
      "developer tool page",
      "flat layout",
      "rounded cards",
      "gradient backgrounds"
    ]
  }
] : [];

const checks = [
  {
    file: "index.html",
    includes: [
      publicUrl,
      "Analyze public repo",
      "browser-analyzer.js",
      "Report contract",
      "Verification"
    ],
    excludes: [
      "border-radius",
      "linear-gradient",
      "radial-gradient",
      "box-shadow"
    ]
  },
  {
    file: "browser-analyzer.js",
    includes: [
      "raw.githubusercontent.com",
      "fetchRawText",
      "GitHub rate limited",
      "copyCommandButton"
    ]
  },
  {
    file: "CNAME",
    includes: ["deslop.imagineqira.com"]
  },
  ...sourceChecks,
  {
    file: "USAGE.md",
    includes: [
      "# Using DeSlop",
      "npx -y github:TheArtOfSound/DeSlop -- .",
      "GitHub Actions"
    ]
  },
  {
    file: "robots.txt",
    includes: ["Sitemap: https://deslop.imagineqira.com/sitemap.xml"]
  },
  {
    file: "sitemap.xml",
    includes: ["<loc>https://deslop.imagineqira.com/</loc>"]
  },
  {
    file: "llms.txt",
    includes: [
      "# DeSlop",
      "Public page: https://deslop.imagineqira.com/",
      "schemaVersion: 1"
    ]
  },
  {
    file: "status.json",
    includes: [
      "\"name\": \"DeSlop\"",
      "\"publicUrl\": \"https://deslop.imagineqira.com/\"",
      "\"artifactDirectory\": \"dist-page\""
    ]
  }
];

await access(join(baseDir, ".nojekyll"));

for (const check of checks) {
  const filePath = join(baseDir, check.file);
  const text = await readFile(filePath, "utf8");
  for (const expected of check.includes) {
    if (!text.includes(expected)) {
      throw new Error(`${filePath} is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of check.excludes ?? []) {
    if (text.includes(forbidden)) {
      throw new Error(`${filePath} contains forbidden public-page styling: ${forbidden}`);
    }
  }
}

console.log(`Public page verification passed for ${baseDir}.`);
