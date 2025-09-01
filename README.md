# qr-port

Expose local ports as QR codes in your terminal for easy access from mobile devices.

## Overview

`qr-port` is a CLI tool that lets you share any local port (e.g., web server, API, dev environment) by generating a QR code in your terminal. Scan the QR code with your mobile device to instantly access the service running on your machine.

## Features

- Expose any local port as a QR code
- Scan with your phone to open the service instantly
- Simple CLI usage

## Usage

Run directly without installing using npx:

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

### Options

- Specify a custom host:
  ```bash
  qr-port 3000 --host 127.0.0.1
  ```
- Show help:
  ```bash
  qr-port --help
  ```

## Requirements

- Node.js >= 14
- Terminal with QR code display support

## License

MIT

## Contributing

Pull requests and issues are welcome!
