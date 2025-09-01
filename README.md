# qr-port

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

## Requirements

- Node.js >= 14
- Terminal with QR code display support

## License

MIT

## Contributing

Pull requests and issues are welcome!
