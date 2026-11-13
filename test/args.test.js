import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs } from "../src/args.js";
import { DEFAULT_PORT } from "../src/index.js";

const DEFAULTS = {
  port: DEFAULT_PORT,
  host: null,
  protocol: "http",
  format: "qr",
  command: "generate",
};

describe("parseArgs", () => {
  it("defaults to a QR code on the default port", () => {
    assert.deepEqual(parseArgs([]), DEFAULTS);
  });

  it("reads the port from the positional argument", () => {
    assert.equal(parseArgs(["8080"]).port, 8080);
  });

  it("selects an output format", () => {
    assert.equal(parseArgs(["--url"]).format, "url");
    assert.equal(parseArgs(["--json"]).format, "json");
  });

  it("overrides the detected address", () => {
    assert.equal(parseArgs(["--host", "10.0.0.5"]).host, "10.0.0.5");
  });

  it("switches the protocol", () => {
    assert.equal(parseArgs(["--https"]).protocol, "https");
  });

  it("accepts flags and the port in any order", () => {
    const expected = { ...DEFAULTS, port: 8080, format: "json" };

    assert.deepEqual(parseArgs(["--json", "8080"]), expected);
    assert.deepEqual(parseArgs(["8080", "--json"]), expected);
  });

  it("asks for help", () => {
    assert.equal(parseArgs(["--help"]).command, "help");
    assert.equal(parseArgs(["-h"]).command, "help");
  });

  it("shows the help even next to a bad argument", () => {
    assert.equal(parseArgs(["abc", "--help"]).command, "help");
    assert.equal(parseArgs(["--nope", "-h"]).command, "help");
    assert.equal(parseArgs(["abc", "-v"]).command, "version");
  });

  it("rejects a flag where --host expects an address", () => {
    for (const flag of ["--json", "--url", "--https"]) {
      assert.throws(
        () => parseArgs(["3000", "--host", flag]),
        /--host requires an address/
      );
    }
  });

  it("rejects --url together with --json", () => {
    assert.throws(() => parseArgs(["--url", "--json"]), /either --url or --json/);
    assert.equal(parseArgs(["--json", "--json"]).format, "json");
  });

  it("rejects flags that --list would ignore", () => {
    assert.throws(() => parseArgs(["--list", "8080"]), /--list does not take a port/);
    assert.throws(() => parseArgs(["--list", "--url"]), /--list does not take --url/);
    assert.throws(() => parseArgs(["--list", "--https"]), /--https/);
    assert.throws(() => parseArgs(["--list", "--host", "10.0.0.5"]), /--host/);
    assert.equal(parseArgs(["--list", "--json"]).format, "json");
  });

  it("rejects an invalid port", () => {
    for (const arg of ["abc", "0", "70000", "3000abc", "1.5", "1e3", "0x50", " 80", "+80", "-5"]) {
      assert.throws(() => parseArgs([arg]), /Invalid port/, `port: ${arg}`);
    }
  });

  it("rejects an unknown option instead of reading it as a port", () => {
    assert.throws(() => parseArgs(["--nope"]), /Unknown option/);
  });

  it("rejects a second positional argument", () => {
    assert.throws(() => parseArgs(["8080", "9090"]), /Unexpected argument/);
  });

  it("rejects --host without a value", () => {
    assert.throws(() => parseArgs(["--host"]), /--host requires an address/);
  });
});
