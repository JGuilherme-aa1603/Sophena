import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const packageJson = JSON.parse(
  readFileSync("package.json", "utf8"),
) as PackageJson;

describe("deploy scripts", () => {
  test("production start uses a runtime dependency available on Render", () => {
    assert.equal(packageJson.scripts?.start, "tsx src/server.ts");
    assert.ok(packageJson.dependencies?.tsx);
    assert.equal(packageJson.devDependencies?.tsx, undefined);
  });
});
