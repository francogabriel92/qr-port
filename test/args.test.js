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

  it("rejects an invalid port", () => {
    for (const arg of ["abc", "0", "70000", "3000abc", "1.5"]) {
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
