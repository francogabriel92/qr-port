import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PORT, listLanAddresses, resolveLanUrl } from "../src/index.js";

// Tests that exercise real detection need a LAN address on this machine.
const offline = listLanAddresses().length === 0 && "no LAN IPv4 address here";

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

  // Each case lists the virtual interface first, so OS order cannot save it.
  for (const [name, address] of [
    ["VirtualBox Host-Only Network", "192.168.56.1"],
    ["VMware Network Adapter VMnet8", "192.168.74.1"],
    ["vEthernet (WSL)", "172.29.16.1"],
    ["vEthernet (Default Switch)", "172.20.0.1"],
    ["bridge100", "192.168.64.1"],
    ["br-3f2a9c1d7e4b", "172.18.0.1"],
    ["podman0", "10.88.0.1"],
    ["lxdbr0", "10.10.10.1"],
    ["cni0", "10.244.0.1"],
    ["tailscale0", "100.101.102.103"],
  ]) {
    it(`prefers the LAN over ${name}`, () => {
      const found = listLanAddresses(
        interfaces({ [name]: [{ address }], "Wi-Fi": [{ address: "192.168.1.10" }] })
      );

      assert.equal(found[0].address, "192.168.1.10");
    });
  }

  it("prefers a LAN with a public address over a VM bridge", () => {
    const found = listLanAddresses(
      interfaces({
        bridge100: [{ address: "192.168.64.1" }],
        en0: [{ address: "203.0.113.5" }],
      })
    );

    assert.equal(found[0].address, "203.0.113.5");
  });

  it("keeps a Hyper-V external switch, which carries the real LAN", () => {
    const found = listLanAddresses(
      interfaces({
        "vEthernet (External Switch)": [{ address: "192.168.1.10" }],
        "VirtualBox Host-Only Network": [{ address: "192.168.56.1" }],
      })
    );

    assert.equal(found[0].address, "192.168.1.10");
  });

  it("keeps real bridges such as OpenWrt's br-lan", () => {
    const found = listLanAddresses(
      interfaces({
        eth1: [{ address: "203.0.113.7" }],
        "br-lan": [{ address: "192.168.1.1" }],
      })
    );

    assert.equal(found[0].address, "192.168.1.1");
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

  it("builds a URL on the detected address", { skip: offline }, () => {
    const result = resolveLanUrl({ port: 8080 });

    assert.equal(result.port, 8080);
    assert.equal(result.url, `http://${result.host}:8080`);
    assert.ok(result.interface);
  });

  it("defaults to port 3000", () => {
    assert.equal(resolveLanUrl({ host: "10.0.0.5" }).port, DEFAULT_PORT);
  });

  it("rejects a protocol other than http or https", () => {
    for (const protocol of ["ftp", "https:", "javascript"]) {
      assert.throws(
        () => resolveLanUrl({ host: "10.0.0.5", protocol }),
        /Invalid protocol/
      );
    }
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
    const result = resolveLanUrl({ port: 8080, host: "10.0.0.5", protocol: "https" });

    assert.equal(result.protocol, "https");
    assert.equal(result.url, "https://10.0.0.5:8080");
  });

  it("brackets an IPv6 host in the URL only", () => {
    for (const host of ["fe80::1", "[fe80::1]"]) {
      const result = resolveLanUrl({ port: 8080, host });

      assert.equal(result.url, "http://[fe80::1]:8080");
      assert.equal(result.host, "fe80::1");
      assert.doesNotThrow(() => new URL(result.url));
    }
  });

  it("accepts hostnames", () => {
    for (const host of ["localhost", "my-mac.local", "dev.example.com"]) {
      assert.equal(resolveLanUrl({ port: 8080, host }).url, `http://${host}:8080`);
    }
  });

  it("rejects a host that would break the URL", () => {
    for (const host of [
      "10.0.0.5:8080",
      "http://10.0.0.5",
      "x/y",
      "a b",
      " ",
      "--json",
      "fe80::1%en0",
      "user@evil.com",
    ]) {
      assert.throws(() => resolveLanUrl({ host }), /Invalid host/, `host: ${host}`);
    }
  });
});
