#!/usr/bin/env node
"use strict";

import { networkInterfaces } from "os";
import { argv, exit } from "process";
import qrcode from "qrcode-terminal";

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
 * @param {{name: string, address: string}} candidate
 * @returns {number}
 */
function rank({ name, address }) {
  if (VIRTUAL_INTERFACE.test(name)) return 0;
  return PRIVATE_RANGE.test(address) ? 2 : 1;
}

/**
 * Get the local network IP address most likely to be reachable from a phone.
 * @returns {string|null} The best local IP address, or null if none found
 */
function getLocalIP() {
  const interfaces = networkInterfaces();
  const candidates = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets ?? []) {
      if (!isIPv4(net) || net.internal || LINK_LOCAL.test(net.address)) continue;
      candidates.push({ name, address: net.address });
    }
  }

  // Array#sort is stable, so ties keep the order reported by the OS, which
  // already lists the primary interface first.
  candidates.sort((a, b) => rank(b) - rank(a));

  return candidates.length > 0 ? candidates[0].address : null;
}

/**
 * Parse and validate the port number
 * @param {string} portArg - The port argument from command line
 * @returns {number} Valid port number
 */
function parsePort(portArg) {
  const DEFAULT_PORT = 3000;

  if (!portArg) {
    return DEFAULT_PORT;
  }

  const port = parseInt(portArg, 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(
      `❌ Invalid port: ${portArg}. Using default port ${DEFAULT_PORT}`
    );
    return DEFAULT_PORT;
  }

  return port;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
📱 QR Port - Generate QR codes for local development servers

Usage:
  qr-port [port]

Arguments:
  port        Port number (1-65535, default: 3000)

Examples:
  qr-port           # Uses port 3000
  qr-port 8080      # Uses port 8080
  qr-port --help    # Shows this help

The QR code will contain the URL to access your local server from mobile devices.
`);
}

// Handle help flag
if (argv.includes("--help") || argv.includes("-h")) {
  showHelp();
  exit(0);
}

// Get local IP address
const localIP = getLocalIP();

if (!localIP) {
  console.error("❌ Could not find a local network IP address.");
  console.error("   Make sure you are connected to a network.");
  exit(1);
}

// Parse port from command line arguments
const port = parsePort(argv[2]);
const url = `http://${localIP}:${port}`;

console.log(`🚀 Generating QR code for: ${url}\n`);

// Generate QR code
qrcode.generate(url, { small: true }, (qrcode) => {
  console.log(`📱 Scan this QR code to access your server:\n`);
  console.log(qrcode);
  console.log(`\n🌐 Or visit: ${url}`);
  console.log(`📋 Local IP: ${localIP}`);
  console.log(`🔌 Port: ${port}\n`);
});
