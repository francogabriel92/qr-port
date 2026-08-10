import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs } from "../src/args.js";
import { DEFAULT_PORT } from "../src/index.js";

describe("parseArgs", () => {
  it("defaults to a QR code on the default port", () => {
    assert.deepEqual(parseArgs([]), {
      port: DEFAULT_PORT,
      format: "qr",
      command: "generate",
    });
  });

  it("selects an output format", () => {
    assert.equal(parseArgs(["--url"]).format, "url");
    assert.equal(parseArgs(["--json"]).format, "json");
  });

  it("keeps the port alongside a format flag, in any order", () => {
    assert.deepEqual(parseArgs(["--json", "8080"]), {
      port: 8080,
      format: "json",
      command: "generate",
    });
    assert.deepEqual(parseArgs(["8080", "--json"]), {
      port: 8080,
      format: "json",
      command: "generate",
    });
  });

  it("reads the port from the positional argument", () => {
    assert.equal(parseArgs(["8080"]).port, 8080);
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
});
