export type Severity = "low" | "medium" | "high";

export type SlopRule = {
  id: string;
  label: string;
  severity: Severity;
  pattern: RegExp;
  reason: string;
  replacementHint: string;
};

export type Finding = {
  ruleId: string;
  label: string;
  severity: Severity;
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

export type AuditSummary = {
  score: number;
  filesScanned: number;
  findingsTotal: number;
  high: number;
  medium: number;
  low: number;
};

export type AuditReport = {
  summary: AuditSummary;
  findings: Finding[];
};
