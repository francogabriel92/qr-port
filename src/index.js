import { networkInterfaces } from "node:os";

export const DEFAULT_PORT = 3000;

// Interfaces created by VMs, containers, VPNs and peer-to-peer links. They hold
// valid IPv4 addresses that no phone on the LAN can reach, so they rank last.
const VIRTUAL_INTERFACE =
  /^(awdl|br-|docker|llw|ppp|tap|tun|utun|veth|virbr|vmnet|vboxnet|wg|zt)/i;

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
 * Build the URL a phone on the same network can use to reach a local server.
 *
 * @param {{ port?: number }} [options]
 * @returns {{ url: string, host: string, port: number, interface: string }}
 * @throws {Error} If the port is invalid or no LAN address is available.
 */
export function resolveLanUrl({ port = DEFAULT_PORT } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port: ${port}. Expected an integer between 1 and 65535.`
    );
  }

  const [target] = listLanAddresses();

  if (!target) {
    throw new Error(
      "No LAN IPv4 address found. Make sure you are connected to a network."
    );
  }

  return {
    url: `http://${target.address}:${port}`,
    host: target.address,
    port,
    interface: target.interface,
  };
}
