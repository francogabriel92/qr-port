# qr-port

[![npm version](https://img.shields.io/npm/v/qr-port.svg)](https://www.npmjs.com/package/qr-port)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Expose local ports as QR codes in your terminal for easy access from mobile devices.

## Overview

`qr-port` is a CLI tool that lets you share any local port (e.g., web server, API, dev environment) by generating a QR code in your terminal. Scan the QR code with your mobile device to instantly access the service running on your machine.

## Features

- Expose any local port as a QR code
- Scan with your phone to open the service instantly
- Simple CLI usage

## Output example

When you run `npx qr-port 3000`, you will see a QR code in your terminal that looks like this:

![QR code example](https://github.com/francogabriel92/qr-port/blob/main/docs/example.png?raw=true)

## Usage

Run directly without installing using npx:

```bash
npx qr-port
```

```bash
npx qr-port 3000
```

Or Install globally using npm:

```bash
npm install -g qr-port
```

Then run:

```bash
qr-port 3000
```

This will display a QR code in your terminal. Scan it with your mobile device to access `http://<your-local-ip>:3000`.

## Vite or Next.js Integration

For Vite or Next.js projects, you can integrate `qr-port` into your development workflow easily.

### Vite

1. Modify the dev script to your `package.json`:

   ```json
   {
     "scripts": {
       "dev": "npx qr-port 3000 & vite" // Replace with your port
     }
   }
   ```

2. Run the script:

```bash
npm run dev
```

### Next.js

1. Modify the dev script to your `package.json`:

   ```json
   {
     "scripts": {
       "dev": "npx qr-port 3000 & next dev" // Replace with your port
     }
   }
   ```

2. Run the script:

```bash
npm run dev
```

## Programmatic API

The address detection is exported too, in case you want the URL without the QR
code — for example to print it from your own dev script:

```js
import { resolveLanUrl, listLanAddresses } from "qr-port";

resolveLanUrl({ port: 5173 });
// { url: 'http://192.168.1.10:5173', host: '192.168.1.10', port: 5173, interface: 'en0' }

listLanAddresses();
// [{ interface: 'en0', address: '192.168.1.10' }, ...] — best candidate first
```

`resolveLanUrl` throws if the port is outside 1-65535, or if the machine has no
LAN address at all. `listLanAddresses` returns every usable IPv4 address it
found, ordered by how likely it is to be reachable from a phone: virtual
interfaces (Docker, VPNs, VMs) rank last, and link-local addresses are excluded.

## Requirements

- Node.js >= 18
- Terminal with QR code display support

## License

MIT

## Contributing

Pull requests and issues are welcome!
