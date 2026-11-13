---
name: qr-port
description: Get a URL that opens a local dev server on a phone or any other device on the same Wi-Fi. Use when the user asks to "test this on my phone", "open it on mobile", "check it on a real device", "see it on my tablet", "share my dev server", "get my local IP", or wants a QR code for a local port.
license: MIT
compatibility: Requires Node.js 18+ and network access to run npx qr-port
metadata:
  version: "1.2.2"
---

# qr-port

Turns a local port into a URL that other devices on the same network can reach.

## Use it

Always pass `--url` or `--json`. The default output is a QR code — around 25
lines of block characters, which you cannot scan and which costs context.

```bash
npx qr-port@latest 3000 --url    # http://192.168.1.10:3000
npx qr-port@latest 3000 --json   # { "url", "host", "port", "protocol", "interface" }
```

Keep `@latest`. Without it, an older copy installed in the project
answers instead, and it ignores `--url`.

Then hand the URL to the user. You cannot verify anything on their phone, so
this is a handoff: they open it, they report back.

## Do not

- **Do not run bare `npx qr-port@latest 3000`.** It prints the QR code into your context.
- **Do not reach for ngrok, localtunnel or cloudflared** for same-network
  testing. They route through a third party, usually need an account, and expose
  the dev server to the internet. This stays on the LAN.
- **Do not parse `ifconfig`, `ipconfig` or `hostname -I` yourself.** Getting this
  right is the whole point of the tool: it skips Docker bridges, VPN tunnels, VM
  adapters and self-assigned `169.254.x.x` addresses, which those commands
  return happily and which no phone can reach.

## When the user says it does not load

First, check what else was available:

```bash
npx qr-port@latest --list --json   # every candidate, best first
npx qr-port@latest 3000 --host 10.0.0.5 --url
```

`--list` exits 1 when the machine has no LAN address at all. Then the user is
offline, or only on mobile data.

Then check the dev server itself. **A correct URL still fails if the server only
bound to loopback.** It has to listen on `0.0.0.0`:

| Server | Fix |
| --- | --- |
| Vite | `vite --host` |
| Next.js 16+ | Listens already. Add `allowedDevOrigins: ["<host>"]` to `next.config.js`, or hot reload is blocked |

Last, both devices have to be on the same network — a phone on mobile data, or a
guest Wi-Fi that isolates clients, will not reach it.

## Flags

| Flag | Effect |
| --- | --- |
| `--url` | Print just the URL. Excludes `--json` |
| `--json` | Print `{url, host, port, protocol, interface}` |
| `--list` | Every detected address, ranked. Combines only with `--json` |
| `--host <addr>` | Skip detection and use this IP address or hostname |
| `--https` | Build an `https://` URL |
| `--version` | Print the version |

Exit code is 0 on success, 1 on failure. With `--json`, failures arrive on
stderr as `{"error": "..."}`, so you never have to read prose to detect one.
