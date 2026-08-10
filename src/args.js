import { DEFAULT_PORT } from "./index.js";

export const HELP = `
📱 QR Port - Generate QR codes for local development servers

Usage:
  qr-port [port]

Arguments:
  port        Port number (1-65535, default: ${DEFAULT_PORT})

Options:
  -h, --help  Show this help

Examples:
  qr-port           # Uses port ${DEFAULT_PORT}
  qr-port 8080      # Uses port 8080

The QR code will contain the URL to access your local server from mobile devices.
`;

/**
 * Parse the command line arguments.
 *
 * @param {string[]} args Arguments after the node binary and the script path.
 * @returns {{ port: number, command: "generate" | "help" }}
 * @throws {Error} On an unknown option, an extra argument or an invalid port.
 */
export function parseArgs(args) {
  const options = { port: DEFAULT_PORT, command: "generate" };
  let portSeen = false;

  for (const arg of args) {
    switch (arg) {
      case "-h":
      case "--help":
        return { ...options, command: "help" };
      default:
        if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
        if (portSeen) throw new Error(`Unexpected argument: ${arg}`);
        options.port = parsePort(arg);
        portSeen = true;
    }
  }

  return options;
}

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port: ${value}. Expected an integer between 1 and 65535.`
    );
  }

  return port;
}
