import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileInput } from "./types";

const ignoredDirNames = new Set([".git", "node_modules", "dist", "dist-page", "build", "coverage", ".next", ".turbo", ".cache"]);
const scannedExtensions = new Set([".md", ".mdx", ".txt", ".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css"]);

export const defaultMaxFileBytes = 1_000_000;

export type CollectFilesOptions = {
  reportRoot?: string;
  maxFileBytes?: number;
};

export async function collectFiles(root: string, options: CollectFilesOptions = {}): Promise<FileInput[]> {
  const stats = await fs.stat(root);

  if (stats.isFile()) {
    if (!shouldScanFile(root)) return [];
    if (!shouldReadFile(stats.size, options.maxFileBytes)) return [];
    return [{ path: toReportPath(root, options.reportRoot), content: await fs.readFile(root, "utf8") }];
  }

  if (!stats.isDirectory()) return [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: FileInput[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if (shouldIgnoreDirectory(entry.name)) continue;
      files.push(...await collectFiles(fullPath, options));
      continue;
    }

    if (entry.isFile() && shouldScanFile(fullPath)) {
      const fileStats = await fs.stat(fullPath);
      if (!shouldReadFile(fileStats.size, options.maxFileBytes)) continue;
      files.push({ path: toReportPath(fullPath, options.reportRoot), content: await fs.readFile(fullPath, "utf8") });
    }
  }

  return files;
}

export function shouldIgnoreDirectory(name: string): boolean {
  return ignoredDirNames.has(name);
}

export function shouldScanFile(filePath: string): boolean {
  return scannedExtensions.has(path.extname(filePath).toLowerCase());
}

export function shouldReadFile(sizeBytes: number, maxFileBytes: number | undefined): boolean {
  return sizeBytes <= (maxFileBytes ?? defaultMaxFileBytes);
}

export function toReportPath(filePath: string, reportRoot: string | undefined): string {
  if (!reportRoot) return filePath;

  const relative = path.relative(reportRoot, filePath);
  if (relative === "") return ".";
  if (relative.startsWith("..") || path.isAbsolute(relative)) return filePath;

  return relative.split(path.sep).join("/");
}
