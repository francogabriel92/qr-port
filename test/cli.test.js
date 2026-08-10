import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const CLI = fileURLToPath(new URL("../src/cli.js", import.meta.url));

const run = (...args) =>
  spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });

describe("cli", () => {
  it("prints a QR code and the URL for the given port", () => {
    const { status, stdout } = run("8080");

    assert.equal(status, 0);
    assert.match(stdout, /http:\/\/[\d.]+:8080/);
    assert.match(stdout, /█/);
  });

  it("exits with an error on an invalid port", () => {
    for (const arg of ["abc", "0", "70000", "3000abc"]) {
      const { status, stderr } = run(arg);

      assert.equal(status, 1, `expected "${arg}" to be rejected`);
      assert.match(stderr, /Invalid port/);
    }
  });

  it("shows the help without touching the network", () => {
    const { status, stdout } = run("--help");

    assert.equal(status, 0);
    assert.match(stdout, /Usage:/);
  });
});
