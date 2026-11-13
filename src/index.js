import { isIP } from "node:net";
import { networkInterfaces } from "node:os";

export const DEFAULT_PORT = 3000;

// Interfaces created by VMs, containers, VPNs and peer-to-peer links. They hold
// valid IPv4 addresses that no phone on the LAN can reach, so they rank last.
// Case-sensitive on purpose: /veth/i would also match a Hyper-V external switch,
// "vEthernet (External Switch)", which carries the real LAN address.
const VIRTUAL_INTERFACE = new RegExp(
  [
    // Linux and macOS.
    "^(awdl|cni|docker|feth|flannel|llw|lxcbr|lxdbr|nordlynx|podman|ppp|tailscale|tap|tun|utun|veth|virbr|vmnet|vboxnet|vnic|wg|zt)",
    // Docker user-defined networks. Not "br-" alone: OpenWrt's LAN is br-lan.
    "^br-[0-9a-f]{12}$",
    // macOS VMs and Internet Sharing. bridge0 is the Thunderbolt bridge.
    "^bridge[1-9]\\d{2}$",
    // Windows.
    "^(VirtualBox|VMware)",
    "^vEthernet \\((WSL|Default Switch)",
  ].join("|")
);

// RFC 1123: dot-separated labels of letters, digits and inner hyphens.
const HOSTNAME =
  /^(?!-)[a-z\d-]{1,63}(?<!-)(\.(?!-)[a-z\d-]{1,63}(?<!-))*\.?$/i;

// Self-assigned addresses: the interface has no working DHCP lease.
const LINK_LOCAL = /^169\.254\./;

const PRIVATE_RANGE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

// Node <= 17 reports family as "IPv4", Node >= 18 as the number 4.
const isIPv4 = (net) => net.family === "IPv4" || net.family === 4;

/**
 * Rank a candidate address. Higher is more likely to be reachable from a phone
 * sitting on the same network.
 * @param {{ interface: string, address: string }} candidate
 * @returns {number}
 */
function rank(candidate) {
  if (VIRTUAL_INTERFACE.test(candidate.interface)) return 0;
  return PRIVATE_RANGE.test(candidate.address) ? 2 : 1;
}

/**
 * List the machine's LAN IPv4 addresses, best candidate first.
 *
 * @param {ReturnType<typeof networkInterfaces>} [interfaces] Defaults to the
 *   real interfaces; injectable so the ranking can be tested.
 * @returns {Array<{ interface: string, address: string }>}
 */
export function listLanAddresses(interfaces = networkInterfaces()) {
  const candidates = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets ?? []) {
      if (!isIPv4(net) || net.internal || LINK_LOCAL.test(net.address)) continue;
      candidates.push({ interface: name, address: net.address });
    }
  }

  // Array#sort is stable, so ties keep the order reported by the OS, which
  // already lists the primary interface first.
  return candidates.sort((a, b) => rank(b) - rank(a));
}

/**
 * Validate a user-supplied host and return how it goes into a URL.
 * IPv6 addresses get brackets; zone IDs are rejected, since browsers drop them.
 */
function parseHost(value) {
  const bare = value.replace(/^\[(.*)\]$/, "$1");

  if (isIP(bare) === 6 && !bare.includes("%")) {
    return { address: bare, urlHost: `[${bare}]` };
  }
  if (isIP(value) === 4 || HOSTNAME.test(value)) {
    return { address: value, urlHost: value };
  }

  throw new Error(
    `Invalid host: ${value}. Expected an IPv4 address, an IPv6 address or a hostname.`
  );
}

/**
 * Build the URL a phone on the same network can use to reach a local server.
 *
 * @param {{ port?: number, host?: string, protocol?: "http" | "https" }} [options]
 *   `host` skips detection entirely; `interface` comes back null in that case.
 * @returns {{ url: string, host: string, port: number, protocol: string,
 *   interface: string | null }}
 * @throws {Error} If the port, protocol or host is invalid, or no LAN address
 *   is available.
 */
export function resolveLanUrl({
  port = DEFAULT_PORT,
  host,
  protocol = "http",
} = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port: ${port}. Expected an integer between 1 and 65535.`
    );
  }

  if (protocol !== "http" && protocol !== "https") {
    throw new Error(`Invalid protocol: ${protocol}. Expected http or https.`);
  }

  const target = host
    ? { interface: null, ...parseHost(host) }
    : listLanAddresses()[0];

  if (!target) {
    throw new Error(
      "No LAN IPv4 address found. Make sure you are connected to a network, " +
        "or pass one explicitly with --host."
    );
  }

  return {
    url: `${protocol}://${target.urlHost ?? target.address}:${port}`,
    host: target.address,
    port,
    protocol,
    interface: target.interface,
  };
}
