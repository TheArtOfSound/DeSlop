import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const outputDir = "dist-page";
const files = ["index.html", "USAGE.md", "robots.txt", "sitemap.xml", "llms.txt", "status.json", ".nojekyll"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await copyFile(file, join(outputDir, file));
}

console.log(`Public page artifact built in ${outputDir}.`);
