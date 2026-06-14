import assert from "node:assert/strict";
import test from "node:test";
import { shouldIgnoreDirectory, shouldScanFile } from "./fileCollector";

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
