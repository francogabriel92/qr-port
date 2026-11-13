import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { listLanAddresses } from "../src/index.js";

const CLI = fileURLToPath(new URL("../src/cli.js", import.meta.url));

const run = (...args) =>
  spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// Tests that exercise real detection need a LAN address on this machine.
const offline = listLanAddresses().length === 0 && "no LAN IPv4 address here";

describe("cli", () => {
  it("prints a QR code and the URL for the given port", () => {
    const { status, stdout } = run("8080", "--host", "10.0.0.5");

    assert.equal(status, 0);
    assert.match(stdout, /http:\/\/10\.0\.0\.5:8080/);
    assert.match(stdout, /█/);
  });

  it("prints only the URL with --url", () => {
    const { status, stdout } = run("8080", "--host", "10.0.0.5", "--url");

    assert.equal(status, 0);
    assert.equal(stdout, "http://10.0.0.5:8080\n");
  });

  it("prints a parseable object with --json", { skip: offline }, () => {
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

  it("reports a missing --host value instead of using the next flag", () => {
    const { status, stdout, stderr } = run("3000", "--host", "--json");

    assert.equal(status, 1);
    assert.equal(stdout, "");
    assert.match(JSON.parse(stderr).error, /--host requires an address/);
  });

  it("rejects a host that would break the URL", () => {
    const { status, stderr } = run("3000", "--host", "10.0.0.5:8080", "--url");

    assert.equal(status, 1);
    assert.match(stderr, /Invalid host/);
  });

  it("exits with an error on an invalid port", () => {
    for (const arg of ["abc", "0", "70000", "3000abc", "1e3"]) {
      const { status, stderr } = run(arg);

      assert.equal(status, 1, `expected "${arg}" to be rejected`);
      assert.match(stderr, /Invalid port/);
    }
  });

  it("shows the help, even after a bad argument", () => {
    for (const args of [["--help"], ["abc", "--help"]]) {
      const { status, stdout } = run(...args);

      assert.equal(status, 0);
      assert.match(stdout, /Usage:/);
    }
  });
});

describe("cli --list", { skip: offline }, () => {
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

  it("rejects flags it would ignore", () => {
    const { status, stderr } = run("--list", "--url");

    assert.equal(status, 1);
    assert.match(stderr, /--list does not take --url/);
  });
});

describe("cli --version", () => {
  const { version } = JSON.parse(read("../package.json"));

  it("prints the version from package.json", () => {
    const { status, stdout } = run("--version");

    assert.equal(status, 0);
    assert.equal(stdout.trim(), version);
  });

  it("matches the version the skill declares", () => {
    const skill = read("../skills/qr-port/SKILL.md");

    assert.match(skill, new RegExp(`version: "${version}"`));
  });
});
