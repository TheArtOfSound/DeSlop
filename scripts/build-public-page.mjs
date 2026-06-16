import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const outputDir = "dist-page";
const files = ["index.html", "browser-analyzer.js", "CNAME", "USAGE.md", "robots.txt", "sitemap.xml", "llms.txt", "llms-full.txt", "humans.txt", "site.webmanifest", "og-image.svg", "status.json", ".nojekyll"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await copyFile(file, join(outputDir, file));
}

console.log(`Public page artifact built in ${outputDir}.`);
