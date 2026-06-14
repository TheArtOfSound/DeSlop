import { slopRules } from "./slopRules";
import type { AuditReport, AuditSummary, CategoryCounts, FileInput, Finding, RuleCategory, Severity } from "./types";

const ignoreFileMarker = "deslop:ignore-file";
const ignoreLineMarker = "deslop:ignore-line";

const categories: RuleCategory[] = ["copy", "ux", "implementation", "security", "release-hygiene"];

const severityWeight: Record<Severity, number> = {
  high: 8,
  medium: 4,
  low: 1
};

export function analyzeFiles(files: FileInput[]): AuditReport {
  const findings: Finding[] = [];
  let filesScanned = 0;

  for (const file of files) {
    if (file.content.includes(ignoreFileMarker)) continue;

    filesScanned += 1;
    const lineStarts = getLineStarts(file.content);
    const seenRuleLines = new Set<string>();

    for (const rule of slopRules) {
      rule.pattern.lastIndex = 0;

      for (const match of file.content.matchAll(rule.pattern)) {
        if (match.index === undefined) continue;
        const excerpt = getLine(file.content, match.index).trim();
        if (excerpt.includes(ignoreLineMarker)) continue;

        const location = getLocation(lineStarts, match.index);
        const seenKey = `${rule.id}:${location.line}`;
        if (seenRuleLines.has(seenKey)) continue;
        seenRuleLines.add(seenKey);

        const matchedText = match[0];
        findings.push({
          ruleId: rule.id,
          label: rule.label,
          severity: rule.severity,
          category: rule.category,
          filePath: file.path,
          line: location.line,
          column: location.column,
          endColumn: location.column + matchedText.length,
          matchedText,
          excerpt,
          reason: rule.reason,
          replacementHint: rule.replacementHint
        });
      }
    }
  }

  findings.sort((a, b) => {
    const severityDelta = severityWeight[b.severity] - severityWeight[a.severity];
    if (severityDelta !== 0) return severityDelta;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
    return a.line - b.line || a.column - b.column;
  });

  return {
    summary: summarize(filesScanned, findings),
    findings
  };
}

function summarize(filesScanned: number, findings: Finding[]): AuditSummary {
  const high = findings.filter((finding) => finding.severity === "high").length;
  const medium = findings.filter((finding) => finding.severity === "medium").length;
  const low = findings.filter((finding) => finding.severity === "low").length;
  const penalty = high * severityWeight.high + medium * severityWeight.medium + low * severityWeight.low;
  const byCategory = emptyCategoryCounts();

  for (const finding of findings) {
    byCategory[finding.category] += 1;
  }

  return {
    score: Math.max(0, 100 - penalty),
    filesScanned,
    findingsTotal: findings.length,
    high,
    medium,
    low,
    byCategory
  };
}

function emptyCategoryCounts(): CategoryCounts {
  return categories.reduce<CategoryCounts>((counts, category) => {
    counts[category] = 0;
    return counts;
  }, {
    copy: 0,
    ux: 0,
    implementation: 0,
    security: 0,
    "release-hygiene": 0
  });
}

function getLineStarts(content: string): number[] {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function getLocation(lineStarts: number[], index: number): { line: number; column: number } {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const current = lineStarts[mid];
    const next = lineStarts[mid + 1] ?? Number.POSITIVE_INFINITY;

    if (index >= current && index < next) {
      return { line: mid + 1, column: index - current + 1 };
    }

    if (index < current) high = mid - 1;
    else low = mid + 1;
  }

  return { line: 1, column: index + 1 };
}

function getLine(content: string, index: number): string {
  const start = content.lastIndexOf("\n", index) + 1;
  const end = content.indexOf("\n", index);
  return content.slice(start, end === -1 ? content.length : end);
}
