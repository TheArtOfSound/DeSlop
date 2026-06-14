#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { analyzeFiles } from "./analyzer";
import { shouldExitWithError } from "./exitPolicy";
import { formatTextReport } from "./formatter";
import type { FileInput, Severity } from "./types";

const ignoredDirs = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".cache"]);
const scannedExtensions = new Set([".md", ".mdx", ".txt", ".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css"]);

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const roots = options.paths.length > 0 ? options.paths : [process.cwd()];
  const files: FileInput[] = [];

  for (const root of roots) {
    files.push(...await collectFiles(path.resolve(root)));
  }

  const report = analyzeFiles(files);

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    printReport(report);
  }

  if (shouldExitWithError(report, { failOn: options.failOn, minScore: options.minScore })) {
    process.exitCode = 1;
  }
}

type CliOptions = {
  paths: string[];
  json: boolean;
  help: boolean;
  failOn: Severity | null;
  minScore: number | null;
};

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    paths: [],
    json: false,
    help: false,
    failOn: null,
    minScore: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--fail-on") {
      const value = args[index + 1];
      if (!isSeverity(value)) throw new Error("--fail-on must be one of: low, medium, high");
      options.failOn = value;
      index += 1;
      continue;
    }

    if (arg === "--min-score") {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 0 || value > 100) throw new Error("--min-score must be an integer from 0 to 100");
      options.minScore = value;
      index += 1;
      continue;
    }

    options.paths.push(arg);
  }

  return options;
}

async function collectFiles(root: string): Promise<FileInput[]> {
  const stats = await fs.stat(root);

  if (stats.isFile()) {
    if (!shouldScanFile(root)) return [];
    return [{ path: root, content: await fs.readFile(root, "utf8") }];
  }

  if (!stats.isDirectory()) return [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: FileInput[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (entry.isFile() && shouldScanFile(fullPath)) {
      files.push({ path: fullPath, content: await fs.readFile(fullPath, "utf8") });
    }
  }

  return files;
}

function shouldScanFile(filePath: string): boolean {
  return scannedExtensions.has(path.extname(filePath).toLowerCase());
}

function printReport(report: ReturnType<typeof analyzeFiles>): void {
  process.stdout.write(formatTextReport(report));
}

function isSeverity(value: string | undefined): value is Severity {
  return value === "low" || value === "medium" || value === "high";
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`DeSlop failed: ${message}\n`);
  process.exitCode = 1;
});

function printHelp(): void {
  process.stdout.write(`Usage: deslop [paths...] [--json] [--fail-on high|medium|low] [--min-score 90]\n\n`);
  process.stdout.write(`Examples:\n`);
  process.stdout.write(`  npm run audit -- .\n`);
  process.stdout.write(`  npm run audit -- README.md --fail-on high\n`);
  process.stdout.write(`  npm run audit -- . --json\n`);
  process.stdout.write(`  npm run audit -- . --min-score 90\n`);
}
