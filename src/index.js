#!/usr/bin/env node
"use strict";

import { networkInterfaces } from "os";
import { argv, exit } from "process";
import qrcode from "qrcode-terminal";

/**
 * Get the local network IP address
 * @returns {string|null} The first available local IP address or null if none found
 */
function getLocalIP() {
  const nets = networkInterfaces();
  const results = {};

  // Collect all non-internal IPv4 addresses
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Try to find IP address in order of preference
  const preferredInterfaces = ["en0", "eth0", "wlan0", "wifi0"];

  for (const interfaceName of preferredInterfaces) {
    if (results[interfaceName] && results[interfaceName].length > 0) {
      return results[interfaceName][0];
    }
  }

  // Fallback to first available IP
  const allIPs = Object.values(results).flat();
  return allIPs.length > 0 ? allIPs[0] : null;
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
