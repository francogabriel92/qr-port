#!/usr/bin/env node

import { argv, exit } from "node:process";
import qrcode from "qrcode-terminal";
import { HELP, parseArgs } from "./args.js";
import { resolveLanUrl } from "./index.js";

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

function main() {
  const options = parseArgs(argv.slice(2));

  if (options.command === "help") {
    console.log(HELP);
    return;
  }

  RENDER[options.format](resolveLanUrl(options));
}

try {
  main();
} catch (error) {
  // Read from the raw arguments: parsing itself is what may have failed.
  if (argv.includes("--json")) {
    console.error(JSON.stringify({ error: error.message }));
  } else {
    console.error(`❌ ${error.message}`);
  }
  exit(1);
}
