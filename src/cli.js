#!/usr/bin/env node

import { argv, exit } from "node:process";
import qrcode from "qrcode-terminal";
import { DEFAULT_PORT, resolveLanUrl } from "./index.js";

const HELP = `
📱 QR Port - Generate QR codes for local development servers

Usage:
  qr-port [port]

Arguments:
  port        Port number (1-65535, default: ${DEFAULT_PORT})

Examples:
  qr-port           # Uses port ${DEFAULT_PORT}
  qr-port 8080      # Uses port 8080
  qr-port --help    # Shows this help

The QR code will contain the URL to access your local server from mobile devices.
`;

/**
 * Parse the port argument.
 * @param {string|undefined} portArg
 * @returns {number}
 * @throws {Error} If the argument is not a valid port.
 */
function parsePort(portArg) {
  if (!portArg) return DEFAULT_PORT;

  const port = Number(portArg);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port: ${portArg}. Expected an integer between 1 and 65535.`
    );
  }

  return port;
}

function main() {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return;
  }

  const { url, host, port } = resolveLanUrl({ port: parsePort(argv[2]) });

  console.log(`🚀 Generating QR code for: ${url}\n`);

  qrcode.generate(url, { small: true }, (qr) => {
    console.log("📱 Scan this QR code to access your server:\n");
    console.log(qr);
    console.log(`\n🌐 Or visit: ${url}`);
    console.log(`📋 Local IP: ${host}`);
    console.log(`🔌 Port: ${port}\n`);
  });
}

try {
  main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  exit(1);
}
