import { DEFAULT_PORT } from "./index.js";

export const HELP = `
📱 QR Port - Generate QR codes for local development servers

Usage:
  qr-port [port] [options]

Arguments:
  port              Port number (1-65535, default: ${DEFAULT_PORT})

Options:
  --host <address>  Use this address instead of detecting the LAN IP
  --https           Build an https:// URL
  --url             Print just the URL
  --json            Print the result as JSON
  --list            List every LAN address found, best candidate first
  -h, --help        Show this help
  -v, --version     Show the version

Examples:
  qr-port                       # Uses port ${DEFAULT_PORT}
  qr-port 8080                  # Uses port 8080
  open $(qr-port 8080 --url)    # Pipe the URL somewhere else
  qr-port 8080 --json           # { "url": "...", "host": "...", ... }
  qr-port 8080 --host 10.0.0.5  # When detection picks the wrong address
  qr-port --list                # Find the address to pass to --host

The QR code will contain the URL to access your local server from mobile devices.
`;

/**
 * Parse the command line arguments.
 *
 * @param {string[]} args Arguments after the node binary and the script path.
 * @returns {{ port: number, host: string | null, protocol: "http" | "https",
 *   format: "qr" | "url" | "json",
 *   command: "generate" | "list" | "help" | "version" }}
 * @throws {Error} On an unknown option, a missing value, an extra argument or
 *   an invalid port.
 */
export function parseArgs(args) {
  const options = {
    port: DEFAULT_PORT,
    host: null,
    protocol: "http",
    format: "qr",
    command: "generate",
  };
  let portSeen = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        return { ...options, command: "help" };
      case "-v":
      case "--version":
        return { ...options, command: "version" };
      case "--list":
        options.command = "list";
        break;
      case "--url":
        options.format = "url";
        break;
      case "--json":
        options.format = "json";
        break;
      case "--https":
        options.protocol = "https";
        break;
      case "--host":
        options.host = args[++i] ?? null;
        if (!options.host) throw new Error("--host requires an address.");
        break;
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
