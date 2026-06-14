#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { analyzeFiles } from "./analyzer";
import type { AuditReport, FileInput, Severity } from "./types";

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

  if (options.failOn && shouldFail(report, options.failOn)) {
    process.exitCode = 1;
  }
}

type CliOptions = {
  paths: string[];
  json: boolean;
  help: boolean;
  failOn: Severity | null;
};

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    paths: [],
    json: false,
    help: false,
    failOn: null
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

function printReport(report: AuditReport): void {
  const { summary } = report;
  process.stdout.write(`DeSlop wording audit\n`);
  process.stdout.write(`Score: ${summary.score}/100\n`);
  process.stdout.write(`Files scanned: ${summary.filesScanned}\n`);
  process.stdout.write(`Findings: ${summary.findingsTotal} (${summary.high} high, ${summary.medium} medium, ${summary.low} low)\n\n`);

  if (report.findings.length === 0) {
    process.stdout.write("No wording slop detected by the current rule set.\n");
    return;
  }

  for (const finding of report.findings) {
    process.stdout.write(`[${finding.severity.toUpperCase()}] ${finding.label}\n`);
    process.stdout.write(`${finding.filePath}:${finding.line}:${finding.column}\n`);
    process.stdout.write(`  Match: ${finding.matchedText}\n`);
    process.stdout.write(`  Line: ${finding.excerpt}\n`);
    process.stdout.write(`  Why it matters: ${finding.reason}\n`);
    process.stdout.write(`  Fix direction: ${finding.replacementHint}\n\n`);
  }
}

function shouldFail(report: AuditReport, failOn: Severity): boolean {
  if (failOn === "high") return report.summary.high > 0;
  if (failOn === "medium") return report.summary.high + report.summary.medium > 0;
  return report.summary.findingsTotal > 0;
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
  process.stdout.write(`Usage: deslop [paths...] [--json] [--fail-on high|medium|low]\n\n`);
  process.stdout.write(`Examples:\n`);
  process.stdout.write(`  npm run audit -- .\n`);
  process.stdout.write(`  npm run audit -- README.md --fail-on high\n`);
  process.stdout.write(`  npm run audit -- . --json\n`);
}
