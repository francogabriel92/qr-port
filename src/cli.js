#!/usr/bin/env node

import { createRequire } from "node:module";
import { argv, exit } from "node:process";
import qrcode from "qrcode-terminal";
import { HELP, parseArgs } from "./args.js";
import { listLanAddresses, resolveLanUrl } from "./index.js";

const RENDER = {
  url: ({ url }) => console.log(url),

  json: (result) => console.log(JSON.stringify(result, null, 2)),

  qr: ({ url, host, port }) => {
    console.log(`🚀 Generating QR code for: ${url}\n`);

    qrcode.generate(url, { small: true }, (qr) => {
      console.log("📱 Scan this QR code to access your server:\n");
      console.log(qr);
      console.log(`\n🌐 Or visit: ${url}`);
      console.log(`📋 Local IP: ${host}`);
      console.log(`🔌 Port: ${port}\n`);
    });
  },
};

function listAddresses(format) {
  const addresses = listLanAddresses();

  if (addresses.length === 0) {
    throw new Error(
      "No LAN IPv4 address found. Make sure you are connected to a network."
    );
  }

  if (format === "json") {
    console.log(JSON.stringify({ addresses }, null, 2));
    return;
  }

  for (const { interface: name, address } of addresses) {
    console.log(`${name}\t${address}`);
  }
}

// Read from the raw arguments until parsing succeeds: parsing may be what fails.
let format = argv.includes("--json") ? "json" : "qr";

function main() {
  const options = parseArgs(argv.slice(2));
  format = options.format;

  if (options.command === "help") {
    console.log(HELP);
    return;
  }

  if (options.command === "version") {
    console.log(createRequire(import.meta.url)("../package.json").version);
    return;
  }

  if (options.command === "list") {
    listAddresses(options.format);
    return;
  }

  RENDER[options.format](resolveLanUrl(options));
}

try {
  main();
} catch (error) {
  if (format === "json") {
    console.error(JSON.stringify({ error: error.message }));
  } else {
    console.error(`❌ ${error.message}`);
  }
  exit(1);
}
