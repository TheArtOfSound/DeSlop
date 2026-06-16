import { access, readFile } from "node:fs/promises";

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
  {
    file: ".github/workflows/pages.yml",
    includes: [
      "actions/configure-pages@v5",
      "actions/upload-pages-artifact@v3",
      "actions/deploy-pages@v4"
    ]
  },
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
  }
];

await access(".nojekyll");

for (const check of checks) {
  const text = await readFile(check.file, "utf8");
  for (const expected of check.includes) {
    if (!text.includes(expected)) {
      throw new Error(`${check.file} is missing expected text: ${expected}`);
    }
  }
}

console.log("Public page verification passed.");
