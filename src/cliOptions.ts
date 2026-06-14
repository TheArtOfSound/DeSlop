import type { Severity } from "./types";

export type CliOptions = {
  paths: string[];
  json: boolean;
  help: boolean;
  failOn: Severity | null;
  minScore: number | null;
  maxFileBytes: number | null;
};

export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    paths: [],
    json: false,
    help: false,
    failOn: null,
    minScore: null,
    maxFileBytes: null
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
      options.minScore = parseBoundedInteger(args[index + 1], "--min-score", 0, 100);
      index += 1;
      continue;
    }

    if (arg === "--max-file-bytes") {
      options.maxFileBytes = parseBoundedInteger(args[index + 1], "--max-file-bytes", 1, Number.MAX_SAFE_INTEGER);
      index += 1;
      continue;
    }

    options.paths.push(arg);
  }

  return options;
}

function parseBoundedInteger(value: string | undefined, flagName: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${flagName} must be an integer from ${min} to ${max}`);
  }
  return parsed;
}

function isSeverity(value: string | undefined): value is Severity {
  return value === "low" || value === "medium" || value === "high";
}
