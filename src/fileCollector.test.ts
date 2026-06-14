import assert from "node:assert/strict";
import test from "node:test";
import { shouldIgnoreDirectory, shouldScanFile, toReportPath } from "./fileCollector";

test("recognizes ignored dependency and build directories", () => {
  assert.equal(shouldIgnoreDirectory("node_modules"), true);
  assert.equal(shouldIgnoreDirectory("dist"), true);
  assert.equal(shouldIgnoreDirectory("src"), false);
});

test("recognizes scanned text and source file extensions", () => {
  assert.equal(shouldScanFile("README.md"), true);
  assert.equal(shouldScanFile("App.TSX"), true);
  assert.equal(shouldScanFile("archive.zip"), false);
});

test("keeps repo-local report paths relative", () => {
  assert.equal(toReportPath("/repo/src/App.tsx", "/repo"), "src/App.tsx");
  assert.equal(toReportPath("/repo/README.md", "/repo"), "README.md");
});

test("keeps outside report paths absolute", () => {
  assert.equal(toReportPath("/other/App.tsx", "/repo"), "/other/App.tsx");
});
