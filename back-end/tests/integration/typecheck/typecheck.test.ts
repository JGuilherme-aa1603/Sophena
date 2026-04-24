import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";

const execFileAsync = promisify(execFile);

test("typecheck passes", async () => {
  const result = await execFileAsync("yarn", ["typecheck"], {
    cwd: process.cwd(),
  });

  assert.equal(result.stderr, "");
});
