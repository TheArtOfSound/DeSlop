import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const baseDir = process.argv[2] ?? ".";
const publicUrl = "https://deslop.imagineqira.com/";

const checks = [
  {
    file: "index.html",
    includes: [
      publicUrl,
      "Static Repo Scanner",
      "application/ld+json",
      "og:title",
      "twitter:card",
      "llms-full.txt",
      "browser-analyzer.js?v=cdn-fallback-1"
    ],
    excludes: ["border-radius", "linear-gradient", "radial-gradient", "box-shadow"]
  },
  {
    file: "browser-analyzer.js",
    includes: ["raw.githubusercontent.com", "cdn.jsdelivr.net", "getCdnCandidates", "copyCommandButton"]
  },
  { file: "CNAME", includes: ["deslop.imagineqira.com"] },
  { file: "USAGE.md", includes: ["# Using DeSlop", "GitHub Actions"] },
  { file: "robots.txt", includes: ["Sitemap: https://deslop.imagineqira.com/sitemap.xml", "Allow: /llms-full.txt"] },
  { file: "sitemap.xml", includes: ["<loc>https://deslop.imagineqira.com/</loc>", "<lastmod>2026-06-15</lastmod>"] },
  { file: "llms.txt", includes: ["# DeSlop", "Full context: https://deslop.imagineqira.com/llms-full.txt"] },
  { file: "llms-full.txt", includes: ["# DeSlop full context", "Repository: https://github.com/TheArtOfSound/DeSlop"] },
  { file: "humans.txt", includes: ["DeSlop", "Bryan Leonard"] },
  { file: "site.webmanifest", includes: ["\"name\": \"DeSlop\"", "\"categories\""] },
  { file: "og-image.svg", includes: ["<svg", "DeSlop"] },
  { file: "status.json", includes: ["\"name\": \"DeSlop\"", "\"publicUrl\": \"https://deslop.imagineqira.com/\""] }
];

if (baseDir === ".") {
  checks.push({ file: ".github/workflows/pages.yml", includes: ["actions/configure-pages@v5", "actions/deploy-pages@v4"] });
}

await access(join(baseDir, ".nojekyll"));

for (const check of checks) {
  const filePath = join(baseDir, check.file);
  const text = await readFile(filePath, "utf8");
  for (const expected of check.includes) {
    if (!text.includes(expected)) throw new Error(`${filePath} is missing expected text: ${expected}`);
  }
  for (const forbidden of check.excludes ?? []) {
    if (text.includes(forbidden)) throw new Error(`${filePath} contains forbidden public-page styling: ${forbidden}`);
  }
}

console.log(`Public page verification passed for ${baseDir}.`);
