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
The server has to listen on 0.0.0.0, not only on localhost.

Exits 0 on success and 1 on failure. With --json, errors go to stderr as
{"error": "..."}.
`;

/**
 * Parse the command line arguments.
 *
 * @param {string[]} args Arguments after the node binary and the script path.
 * @returns {{ port: number, host: string | null, protocol: "http" | "https",
 *   format: "qr" | "url" | "json",
 *   command: "generate" | "list" | "help" | "version" }}
 * @throws {Error} On an unknown option, a missing value, an extra argument,
 *   an invalid port or conflicting flags.
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

  // Help and version win wherever they appear, even next to a bad argument.
  if (args.includes("-h") || args.includes("--help")) {
    return { ...options, command: "help" };
  }
  if (args.includes("-v") || args.includes("--version")) {
    return { ...options, command: "version" };
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--list":
        options.command = "list";
        break;
      case "--url":
      case "--json": {
        const format = arg.slice(2);
        if (options.format !== "qr" && options.format !== format) {
          throw new Error("Pass either --url or --json, not both.");
        }
        options.format = format;
        break;
      }
      case "--https":
        options.protocol = "https";
        break;
      case "--host":
        options.host = args[++i] ?? null;
        // A flag here means the address is missing: `--host $EMPTY --json`.
        if (!options.host || options.host.startsWith("-")) {
          throw new Error("--host requires an address.");
        }
        break;
      default:
        // "-5" is a bad port, not an unknown option.
        if (arg.startsWith("-") && !/^-\d/.test(arg)) {
          throw new Error(`Unknown option: ${arg}`);
        }
        if (portSeen) throw new Error(`Unexpected argument: ${arg}`);
        options.port = parsePort(arg);
        portSeen = true;
    }
  }

  if (options.command === "list") {
    const ignored = [
      portSeen && "a port",
      options.host && "--host",
      options.protocol === "https" && "--https",
      options.format === "url" && "--url",
    ].filter(Boolean);

    if (ignored.length) {
      throw new Error(`--list does not take ${ignored.join(", ")}.`);
    }
  }

  return options;
}

function parsePort(value) {
  // Number() alone accepts "1e3", "0x50" and " 80".
  const port = /^\d+$/.test(value) ? Number(value) : NaN;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port: ${value}. Expected an integer between 1 and 65535.`
    );
  }

  return port;
}
