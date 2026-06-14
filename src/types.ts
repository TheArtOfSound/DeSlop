export type Severity = "low" | "medium" | "high";

export type RuleCategory = "copy" | "ux" | "implementation" | "security" | "release-hygiene";

export type SlopRule = {
  id: string;
  label: string;
  severity: Severity;
  category: RuleCategory;
  pattern: RegExp;
  reason: string;
  replacementHint: string;
};

export type Finding = {
  ruleId: string;
  label: string;
  severity: Severity;
  category: RuleCategory;
  filePath: string;
  line: number;
  column: number;
  endColumn: number;
  matchedText: string;
  excerpt: string;
  reason: string;
  replacementHint: string;
};

export type FileInput = {
  path: string;
  content: string;
};

export type CategoryCounts = Record<RuleCategory, number>;

export type AuditSummary = {
  score: number;
  filesScanned: number;
  findingsTotal: number;
  high: number;
  medium: number;
  low: number;
  byCategory: CategoryCounts;
};

export type AuditReport = {
  schemaVersion: 1;
  summary: AuditSummary;
  findings: Finding[];
};
