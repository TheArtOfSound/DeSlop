import { slopRules } from "./slopRules";
import type { RuleCategory, Severity } from "./types";

export type RuleMetadata = {
  id: string;
  label: string;
  severity: Severity;
  category: RuleCategory;
  reason: string;
  replacementHint: string;
};

export function listRuleMetadata(): RuleMetadata[] {
  return slopRules.map(({ id, label, severity, category, reason, replacementHint }) => ({
    id,
    label,
    severity,
    category,
    reason,
    replacementHint
  }));
}
