import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const baseDir = process.argv[2] ?? ".";
const sourceChecks = baseDir === "." ? [
  {
    file: ".github/workflows/pages.yml",
    includes: [
      "actions/configure-pages@v5",
      "actions/upload-pages-artifact@v3",
      "actions/deploy-pages@v4"
    ]
  }
] : [];

const checks = [
  {
    file: "index.html",
    includes: [
      "https://theartofsound.github.io/DeSlop/",
      "Report contract",
      "Verification",
      "Deploy runs"
    ]
  },
  ...sourceChecks,
  {
    file: "robots.txt",
    includes: ["Sitemap: https://theartofsound.github.io/DeSlop/sitemap.xml"]
  },
  {
    file: "sitemap.xml",
    includes: ["<loc>https://theartofsound.github.io/DeSlop/</loc>"]
  },
  {
    file: "llms.txt",
    includes: [
      "# DeSlop",
      "Public page: https://theartofsound.github.io/DeSlop/",
      "schemaVersion: 1"
    ]
  },
  {
    file: "status.json",
    includes: [
      "\"name\": \"DeSlop\"",
      "\"publicUrl\": \"https://theartofsound.github.io/DeSlop/\"",
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
}

console.log(`Public page verification passed for ${baseDir}.`);
