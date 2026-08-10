# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0]

Everything here is additive. `qr-port 3000` still prints the same QR code it
always did.

### Added

- **Machine-readable output.** `--url` prints the URL alone; `--json` prints
  `{url, host, port, protocol, interface}`. Under `--json`, failures arrive on
  stderr as `{"error": "..."}`, so a caller never has to read prose to detect
  one. The QR code is ~25 lines of block characters — the right output for a
  person, and useless to anything reading stdout.
- **`--list`.** Every detected LAN address, ranked. When the chosen one turns out
  to be unreachable, this is what tells you which to pass to `--host`.
- **`--host <address>`.** Skips detection. The escape hatch for topologies
  ranking cannot resolve on its own; `interface` comes back `null`.
- **`--https`.** For dev servers running TLS.
- **`--version`.**
- **An agent skill**, in the [Agent Skills](https://agentskills.io) format read
  by Claude Code, Cursor, Codex, Copilot and others. Install with
  `npx skills add francogabriel92/qr-port`. It tells an agent to prefer `--url`
  over the QR code, to stay on the LAN rather than reach for a tunnelling
  service, and how to diagnose a URL that does not load. Ships in the package so
  it cannot drift from the flags it documents.

### Changed

- Unknown options are rejected instead of being parsed as a port
  (`qr-port --foo` used to fail with "Invalid port: --foo"), and a second
  positional argument is no longer silently ignored.

## [1.1.0]

A correctness release. The QR code frequently pointed at an address no phone
could reach, which is the one thing this tool exists to get right. The only
addition is the API that had to be extracted to make that logic testable.

### Fixed

- **The QR code often encoded an unreachable address.** Interface selection
  relied on a hardcoded preference list (`en0`, `eth0`, `wlan0`, `wifi0`) that
  misses modern Linux names such as `enp3s0` or `wlp2s0`. Anything not on the
  list fell through to whichever address the OS listed first, which is commonly
  a Docker bridge (`172.17.0.1`), a VirtualBox host-only network, a VPN tunnel
  or a self-assigned `169.254.x.x` address. Candidates are now ranked: link-local
  addresses are discarded, virtual interfaces are pushed to the back, and private
  LAN ranges are preferred.
- **An invalid port silently generated a QR code for port 3000.** It printed an
  error and then exited 0 with a QR code for a server that isn't running there.
  It now exits 1.
- **`parseInt` accepted trailing garbage.** `qr-port 3000abc` was treated as
  port 3000; it is now rejected.
- **Importing the package ran the CLI.** `main` and `bin` both pointed at the
  executable, so importing `qr-port` printed a QR code and could call `exit(1)`
  on the host process. `main` now resolves to a module that only exports
  functions.
- **npm published the whole repository.** Added a `files` field, plus an
  `engines` field declaring the Node version the code actually requires.

### Added

- A small importable API — `listLanAddresses()` and `resolveLanUrl()` — extracted
  so the address logic can be tested. The CLI is now a thin layer on top of it.
- Test suite (`node:test`, no new dependencies) and CI on Node 18 and 22.

## [1.0.1]

### Changed

- README badges and an output example.

## [1.0.0]

Initial release.
