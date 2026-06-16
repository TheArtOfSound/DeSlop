import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const outputDir = "dist-page";
const baseFiles = ["index.html", "browser-analyzer.js", "CNAME", "USAGE.md", "robots.txt", "sitemap.xml", "llms.txt", "llms-full.txt", "humans.txt", "site.webmanifest", "og-image.svg", "status.json", ".nojekyll"];
const rootFiles = await readdir(".");
const rootTextFiles = rootFiles.filter((file) => file.endsWith(".txt") && !baseFiles.includes(file));
const files = [...baseFiles, ...rootTextFiles];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await copyFile(file, join(outputDir, file));
}

console.log(`Public page artifact built in ${outputDir}.`);
