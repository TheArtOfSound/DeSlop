import assert from "node:assert/strict";
import test from "node:test";
import { listRuleMetadata } from "./ruleRegistry";

test("returns rule metadata without regular expressions", () => {
  const metadata = listRuleMetadata();
  assert.equal(metadata.length > 0, true);
  assert.equal("pattern" in metadata[0], false);
});

test("rule metadata has unique ids", () => {
  const ids = listRuleMetadata().map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
});
