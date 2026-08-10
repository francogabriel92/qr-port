import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PORT, listLanAddresses, resolveLanUrl } from "../src/index.js";

/** Build a networkInterfaces()-shaped fixture from a compact description. */
function interfaces(entries) {
  return Object.fromEntries(
    Object.entries(entries).map(([name, nets]) => [
      name,
      nets.map(({ address, family = "IPv4", internal = false }) => ({
        address,
        family,
        internal,
      })),
    ])
  );
}

describe("listLanAddresses", () => {
  it("skips loopback and other internal addresses", () => {
    const found = listLanAddresses(
      interfaces({
        lo0: [{ address: "127.0.0.1", internal: true }],
        en0: [{ address: "192.168.1.10" }],
      })
    );

    assert.deepEqual(found, [{ interface: "en0", address: "192.168.1.10" }]);
  });

  it("skips IPv6 addresses, whichever way Node reports the family", () => {
    const found = listLanAddresses(
      interfaces({
        en0: [
          { address: "fe80::101e:2e60:4b3a:8f41", family: "IPv6" },
          { address: "fe80::2040:a6ff:fee0:78f9", family: 6 },
          { address: "192.168.1.10", family: 4 },
        ],
      })
    );

    assert.deepEqual(found, [{ interface: "en0", address: "192.168.1.10" }]);
  });

  it("skips self-assigned link-local addresses", () => {
    const found = listLanAddresses(
      interfaces({ en0: [{ address: "169.254.12.9" }] })
    );

    assert.deepEqual(found, []);
  });

  it("prefers a real LAN address over a container bridge", () => {
    const found = listLanAddresses(
      interfaces({
        docker0: [{ address: "172.17.0.1" }],
        wlp2s0: [{ address: "192.168.1.10" }],
      })
    );

    assert.equal(found[0].address, "192.168.1.10");
  });

  it("prefers a real LAN address over a VPN tunnel", () => {
    const found = listLanAddresses(
      interfaces({
        utun3: [{ address: "10.8.0.2" }],
        en0: [{ address: "192.168.1.10" }],
      })
    );

    assert.equal(found[0].address, "192.168.1.10");
  });

  it("finds interfaces that are not named en0/eth0/wlan0", () => {
    const found = listLanAddresses(
      interfaces({ enp3s0: [{ address: "10.0.0.42" }] })
    );

    assert.equal(found[0].address, "10.0.0.42");
  });

  it("keeps the order reported by the OS when candidates rank the same", () => {
    const found = listLanAddresses(
      interfaces({
        en0: [{ address: "192.168.1.10" }],
        en1: [{ address: "192.168.1.11" }],
      })
    );

    assert.deepEqual(
      found.map((c) => c.address),
      ["192.168.1.10", "192.168.1.11"]
    );
  });

  it("still returns a virtual interface when it is the only option", () => {
    const found = listLanAddresses(
      interfaces({ docker0: [{ address: "172.17.0.1" }] })
    );

    assert.equal(found[0].address, "172.17.0.1");
  });

  it("returns an empty list when there is no usable address", () => {
    assert.deepEqual(listLanAddresses({}), []);
    assert.deepEqual(listLanAddresses({ lo0: undefined }), []);
  });
});

describe("resolveLanUrl", () => {
  it("rejects ports outside the valid range", () => {
    for (const port of [0, 65536, -1, 1.5, NaN, "8080"]) {
      assert.throws(() => resolveLanUrl({ port }), /Invalid port/);
    }
  });

  it("builds a URL on the detected address", () => {
    const result = resolveLanUrl({ port: 8080 });

    assert.equal(result.port, 8080);
    assert.equal(result.url, `http://${result.host}:8080`);
    assert.ok(result.interface);
  });

  it("defaults to port 3000", () => {
    assert.equal(resolveLanUrl().port, DEFAULT_PORT);
  });
});

describe("resolveLanUrl overrides", () => {
  it("uses an explicit host and reports no interface", () => {
    const result = resolveLanUrl({ port: 8080, host: "10.0.0.5" });

    assert.equal(result.url, "http://10.0.0.5:8080");
    assert.equal(result.host, "10.0.0.5");
    assert.equal(result.interface, null);
  });

  it("builds an https URL", () => {
    const result = resolveLanUrl({ port: 8080, protocol: "https" });

    assert.equal(result.protocol, "https");
    assert.match(result.url, /^https:\/\//);
  });
});
