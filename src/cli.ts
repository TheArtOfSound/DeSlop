#!/usr/bin/env node

import path from "node:path";
import { analyzeFiles } from "./analyzer";
import { parseCliArgs } from "./cliOptions";
import { collectFiles } from "./fileCollector";
import { shouldExitWithError } from "./exitPolicy";
import { formatTextReport } from "./formatter";
import type { FileInput } from "./types";

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const roots = options.paths.length > 0 ? options.paths : [process.cwd()];
  const files: FileInput[] = [];

  for (const root of roots) {
    files.push(...await collectFiles(path.resolve(root), {
      reportRoot: process.cwd(),
      maxFileBytes: options.maxFileBytes ?? undefined
    }));
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

function printReport(report: ReturnType<typeof analyzeFiles>): void {
  process.stdout.write(formatTextReport(report));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`DeSlop failed: ${message}\n`);
  process.exitCode = 1;
});

function printHelp(): void {
  process.stdout.write(`Usage: deslop [paths...] [--json] [--fail-on high|medium|low] [--min-score 90] [--max-file-bytes 1000000]\n\n`);
  process.stdout.write(`Examples:\n`);
  process.stdout.write(`  npm run audit -- .\n`);
  process.stdout.write(`  npm run audit -- README.md --fail-on high\n`);
  process.stdout.write(`  npm run audit -- . --json\n`);
  process.stdout.write(`  npm run audit -- . --min-score 90\n`);
  process.stdout.write(`  npm run audit -- . --max-file-bytes 250000\n`);
}
