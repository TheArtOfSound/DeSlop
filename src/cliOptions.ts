import type { Severity } from "./types";

export type CliOptions = {
  paths: string[];
  json: boolean;
  help: boolean;
  failOn: Severity | null;
  minScore: number | null;
};

export function parseCliArgs(args: string[]): CliOptions {
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

function isSeverity(value: string | undefined): value is Severity {
  return value === "low" || value === "medium" || value === "high";
}
