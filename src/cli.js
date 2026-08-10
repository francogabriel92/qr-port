#!/usr/bin/env node

import { argv, exit } from "node:process";
import qrcode from "qrcode-terminal";
import { HELP, parseArgs } from "./args.js";
import { resolveLanUrl } from "./index.js";

function main() {
  const options = parseArgs(argv.slice(2));

  if (options.command === "help") {
    console.log(HELP);
    return;
  }

  const { url, host, port } = resolveLanUrl({ port: options.port });

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
