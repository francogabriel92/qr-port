import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
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

  it("prints only the URL with --url", () => {
    const { status, stdout } = run("8080", "--url");

    assert.equal(status, 0);
    assert.match(stdout.trim(), /^http:\/\/[\d.]+:8080$/);
  });

  it("prints a parseable object with --json", () => {
    const { status, stdout } = run("8080", "--json");
    const result = JSON.parse(stdout);

    assert.equal(status, 0);
    assert.equal(result.port, 8080);
    assert.equal(result.url, `http://${result.host}:8080`);
    assert.ok(result.interface);
  });

  it("reports errors as JSON when --json was asked for", () => {
    const { status, stderr } = run("abc", "--json");

    assert.equal(status, 1);
    assert.match(JSON.parse(stderr).error, /Invalid port/);
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

describe("cli --list", () => {
  it("lists the detected addresses as text", () => {
    const { status, stdout } = run("--list");

    assert.equal(status, 0);
    assert.match(stdout, /^\S+\t[\d.]+$/m);
  });

  it("lists them as JSON when asked", () => {
    const { status, stdout } = run("--list", "--json");
    const { addresses } = JSON.parse(stdout);

    assert.equal(status, 0);
    assert.ok(addresses.length > 0);
    assert.ok(addresses[0].interface);
    assert.match(addresses[0].address, /^[\d.]+$/);
  });
});

describe("cli --version", () => {
  it("prints the version from package.json", () => {
    const { status, stdout } = run("--version");
    const { version } = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8")
    );

    assert.equal(status, 0);
    assert.equal(stdout.trim(), version);
  });
});
