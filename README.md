# CapsuleCorpOS 1.0.0 "RUBY"
### By Crystal Globe Pty Ltd | ABN 52 635 620 343
### Commander: Android #23

> A Linux-based operating system featuring the RUBY Terminal, Crystal Globe Grid integration, SA Current mesh networking, G347 vessel telemetry, DESTINY_PROTOCOL engine, and full peripheral + disk itemisation law enforcement.

---

## Quick Start

1. Build the ISO: `sudo ./build_iso.sh` (on Ubuntu 22.04/24.04)
2. Flash to USB with [Balena Etcher](https://www.balena.io/etcher/)
3. Boot from USB — select Live or Install
4. Login: `android` / `CrystalGlobe2347`
5. Type `ruby --help`

See [INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md) for the full guide.

---

## Features

- RUBY Terminal shell (replaces bash as default interface)
- SA Current mesh daemon (Crystal Globe Grid sync)
- G347 vessel telemetry + stellar energy monitor
- DESTINY_PROTOCOL daemon (TC write engine)
- AVIS-S bridge (8-module spacecraft AI)
- Auto peripheral registration (keyboard, mouse, display, audio, USB, BT, camera)
- Disk Itemisation Law CG-SIL v1.0 (auto-register all disks)
- nftables firewall (deny-all default)
- LUKS2 encryption support
- Dual-boot: ISOLINUX (BIOS) + GRUB EFI (UEFI)
- Live mode + full installer

---

## Repository Structure

```
capsulecorpos/
├── build_iso.sh                  ISO build script
├── README.md
├── docs/
│   ├── CAPSULECORP_OS_SPEC.md    Full technical specification
│   └── INSTALL_GUIDE.md          Complete installation guide
├── boot/
│   └── grub.cfg                  GRUB EFI config
├── isolinux/
│   └── isolinux.cfg              BIOS boot config
└── rootfs/
    ├── etc/
    │   ├── capsulecorp/          OS config (ccos.conf, nftables, os-release)
    │   ├── udev/rules.d/         Peripheral auto-registration rules
    │   └── systemd/system/       All CCOS services + target
    └── opt/capsulecorp/
        ├── terminal/             RUBY shell + all ccos-* tools + installer
        └── grid/                 SA Current mesh daemon
```

---

*Crystal Globe Pty Ltd | aquaberry.co*
