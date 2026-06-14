import assert from "node:assert/strict";
import test from "node:test";
import { parseCliArgs } from "./cliOptions";

function throws(fn: () => void): boolean {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

test("parses paths and output options", () => {
  const options = parseCliArgs(["README.md", "src", "--json"]);
  assert.equal(options.json, true);
  assert.equal(options.paths.length, 2);
  assert.equal(options.paths[0], "README.md");
  assert.equal(options.paths[1], "src");
});

test("parses failure thresholds", () => {
  const options = parseCliArgs(["--fail-on", "medium", "--min-score", "92"]);
  assert.equal(options.failOn, "medium");
  assert.equal(options.minScore, 92);
});

test("parses scan size threshold", () => {
  const options = parseCliArgs(["--max-file-bytes", "5000"]);
  assert.equal(options.maxFileBytes, 5000);
});

test("rejects invalid minimum scores", () => {
  assert.equal(throws(() => parseCliArgs(["--min-score", "101"])), true);
  assert.equal(throws(() => parseCliArgs(["--min-score", "nope"])), true);
});

test("rejects invalid scan size thresholds", () => {
  assert.equal(throws(() => parseCliArgs(["--max-file-bytes", "0"])), true);
  assert.equal(throws(() => parseCliArgs(["--max-file-bytes", "nope"])), true);
});
