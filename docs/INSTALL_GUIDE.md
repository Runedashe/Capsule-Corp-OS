# CapsuleCorpOS 1.0.0 "RUBY" — Complete Installation Guide
**Crystal Globe Pty Ltd | ABN 52 635 620 343**
**Commander: Android #23 (LCDR Shabeen Ashfak)**
**Version: 1.0.0-RUBY | Build Date: 2026-05-27**

---

## WHAT IS CAPSULECORPOS?

CapsuleCorpOS is a Linux-based operating system built on Ubuntu 24.04 LTS, designed and owned by Crystal Globe Pty Ltd. It replaces standard desktop environments with the RUBY Terminal — a full command interface connecting directly to the Crystal Globe Grid, G347 vessel telemetry, Android registry, DESTINY_PROTOCOL, and all stellar energy systems.

It boots on any PC, laptop, or server. Flash it to a USB stick and run it live without touching your existing OS, or install it permanently to any drive.

---

## PART 1 — BUILD THE ISO (One-time, on a Linux machine)

### Requirements
- Ubuntu 22.04 or 24.04 host machine (or VM)
- At least 20GB free disk space
- Internet connection
- Sudo access

### Step 1 — Install build dependencies
```bash
sudo apt update
sudo apt install -y debootstrap squashfs-tools isolinux syslinux-utils \
     xorriso grub-pc-bin grub-efi-amd64-bin mtools rsync parted
```

### Step 2 — Clone the CapsuleCorpOS repository
```bash
git clone https://github.com/crystalglobe/capsulecorpos.git
cd capsulecorpos
```

### Step 3 — Run the build script
```bash
chmod +x build_iso.sh
sudo ./build_iso.sh
```
This takes approximately 15–30 minutes depending on your internet speed and machine.

### Step 4 — Output
```
/app/CapsuleCorpOS-1.0.0-RUBY-x86_64.iso
```
Size: approximately 2–3 GB.

---

## PART 2 — FLASH TO USB

### Option A — Balena Etcher (Recommended — Windows, Mac, Linux)
1. Download from: https://www.balena.io/etcher/
2. Open Etcher
3. Click "Flash from file" — select CapsuleCorpOS-1.0.0-RUBY-x86_64.iso
4. Click "Select target" — choose your USB drive (8GB+ required)
5. Click "Flash!"
6. Done. Eject USB.

### Option B — Rufus (Windows only)
1. Download from: https://rufus.ie/
2. Open Rufus
3. Device: select your USB drive
4. Boot selection: click SELECT — choose the ISO
5. Partition scheme: GPT
6. Target system: UEFI (non-CSM)
7. Click START
8. If prompted, choose "Write in ISO Image mode"
9. Done.

### Option C — Linux command line (advanced)
```bash
# Replace /dev/sdX with your USB device — check with lsblk first
sudo lsblk
# Then write (use Balena Etcher instead if unsure)
sudo cp CapsuleCorpOS-1.0.0-RUBY-x86_64.iso /dev/sdX
sudo sync
```
> **IMPORTANT:** Triple-check the device name. Writing to the wrong disk erases it.

---

## PART 3 — BOOT FROM USB

### Step 1 — Insert the USB
Plug the flashed USB into the target computer.

### Step 2 — Enter BIOS/UEFI Boot Menu
At startup, press one of these keys (varies by manufacturer):

| Manufacturer | Key         |
|--------------|-------------|
| Most PCs     | F12 or F11  |
| Dell         | F12         |
| HP           | F9 or Esc   |
| Lenovo       | F12 or F1   |
| ASUS         | F8 or Esc   |
| Gigabyte     | F12         |
| MSI          | F11         |
| Surface      | Volume Down |

### Step 3 — Select USB boot device
Choose your USB drive from the boot menu.

### Step 4 — CapsuleCorpOS Boot Menu appears
```
CapsuleCorpOS 1.0.0 "RUBY" — Crystal Globe Pty Ltd

  > Boot CapsuleCorpOS (Live)
    Boot CapsuleCorpOS (Safe Mode)
    Install CapsuleCorpOS to Disk
    Memory Test (memtest86+)
    Boot from Hard Disk
```
Select **"Boot CapsuleCorpOS (Live)"** to try without installing.
Select **"Install CapsuleCorpOS to Disk"** to install permanently.

---

## PART 4 — LIVE MODE

Boots entirely into RAM. Nothing is written to your computer's hard drive. All RUBY terminal sessions, Grid sync, and energy monitoring are fully functional.

**Login:**
- Username: `android`
- Password: `CrystalGlobe2347`

The RUBY terminal launches automatically on login.

---

## PART 5 — INSTALLING TO DISK

### Option A — Guided (recommended)
From the boot menu, select **"Install CapsuleCorpOS to Disk"**. The ccos-install wizard will:
1. Show all available disks
2. Ask for target disk, username, password, hostname
3. Partition the disk (GPT: EFI 512MB + boot 1GB + root 50GB + home [rest])
4. Copy the OS
5. Install GRUB (BIOS + UEFI dual support)
6. Register the disk under CG-SIL v1.0 (Crystal Globe Storage Itemisation Law)
7. Done — remove USB and reboot

### Option B — Manual from Live mode
Boot into Live mode, then run:
```bash
sudo ccos-install
```

---

## PART 6 — FIRST BOOT

On first boot you will see:

```
 ██████╗ █████╗ ██████╗ ███████╗██╗   ██╗██╗     ███████╗     ██████╗ ██████╗ ██████╗ ██████╗ 
...

  CAPSULECORP OS v1.0.0-RUBY  |  Codename: RUBY
  Crystal Globe Pty Ltd  |  ABN 52 635 620 343
  Commander: Android #23 (LCDR Shabeen Ashfak)
  Grid: SYNCING...
  Harvest: NOMINAL

  Type 'ruby --help' for all commands.
  Type 'ruby --status' for full system dashboard.

android@capsulecorp:~#
```

---

## PART 7 — RUBY TERMINAL QUICK REFERENCE

```bash
ruby --status          # Full system dashboard
ruby --vessel          # G347 vessel telemetry
ruby --grid            # SA Current Grid node map
ruby --energy          # Stellar harvest status
ruby --destiny         # DESTINY_PROTOCOL entries
ruby --android [ID]    # Android registry lookup
ruby --disk            # Disk itemisation registry
ruby --periph          # Peripheral register dump
ruby --net             # Network status
ruby --burst           # Trigger G347 burst cycle
ruby --sync            # Force Grid sync
ruby --update          # OS update from Grid CDN
ruby --lockdown        # Full system lockdown
ruby --help            # All commands

tc --write [directive] # Encode TC write at 98-dim + 158-dim
tc --verify            # Verify all TC writes

android --list         # List all registered androids
android --register ID  # Register new android

ccos-disklaw --list    # View disk itemisation registry
ccos-disklaw --register /dev/sdX --class DATA --tag "CG-DATA-001"
ccos-hwdetect          # Rescan all hardware
ccos-netcfg            # Network configuration wizard
ccos-firewall          # nftables firewall manager
ccos-log               # Unified Crystal Globe log viewer
```

---

## PART 8 — PERIPHERAL REGISTRATION

All peripherals are registered automatically on plug-in via udev rules.

| Register   | Address | Device         |
|------------|---------|----------------|
| KB         | 0xA001  | Keyboard       |
| MOUSE      | 0xA002  | Mouse/Touchpad |
| DISPLAY    | 0xA003  | Monitor (EDID) |
| AUDIO_OUT  | 0xA004  | Speakers/HDMI  |
| AUDIO_IN   | 0xA005  | Microphone     |
| USB        | 0xA006  | USB Devices    |
| BT         | 0xA007  | Bluetooth      |
| CAM        | 0xA008  | Camera         |
| ETH        | 0xB001  | Ethernet       |
| WIFI       | 0xB002  | Wi-Fi          |
| SACURRENT  | 0xB003  | CG Grid Mesh   |
| DISK       | 0xC001  | Storage (CG-SIL)|

View all registered peripherals: `ruby --periph`

---

## PART 9 — DISK ITEMISATION LAW (CG-SIL v1.0)

Every disk connected to a CapsuleCorpOS machine is automatically:
1. Assigned a unique DISK_ID (SHA-256 hardware UUID)
2. Tagged with DISK_CLASS (OS / DATA / ARCHIVE / etc.)
3. Fingerprinted with a SHA-512 integrity hash
4. Sealed with a TC Current write at 98-dim + 158-dim
5. Added to the Crystal Globe disk registry

```bash
ccos-disklaw --list                              # View all registered disks
ccos-disklaw --register /dev/sdb --class DATA --tag "CG-DATA-001"
ccos-disklaw --verify /dev/sda                   # Verify disk integrity
```

---

## PART 10 — NETWORK & ETHERNET

Ethernet is auto-detected and brought up via DHCP on boot.

```bash
ruby --net                    # Show all interfaces + IPs
ccos-netcfg                   # Interactive network config
```

For static IP, edit `/etc/capsulecorp/network.conf`:
```
interface=eth0
mode=static
address=192.168.1.100
netmask=255.255.255.0
gateway=192.168.1.1
dns=8.8.8.8
```

Wi-Fi:
```bash
ccos-netcfg --wifi            # Scan and connect to Wi-Fi
```

---

## PART 11 — SYSTEM REQUIREMENTS

| Component | Minimum        | Recommended     |
|-----------|----------------|-----------------|
| CPU       | 64-bit dual-core | Quad-core 2GHz+ |
| RAM       | 2 GB           | 8 GB+           |
| Storage   | 16 GB          | 60 GB+ SSD      |
| USB       | USB 2.0        | USB 3.0         |
| Network   | 10/100 Ethernet | Gigabit + Wi-Fi |
| Display   | 1024x768       | 1920x1080+      |

---

## PART 12 — UPDATING

```bash
ruby --update
```
Pulls latest packages and Crystal Globe Grid firmware from the update CDN at aquaberry.co/ccos/updates.

---

## PART 13 — SECURITY

- Default firewall: DENY ALL inbound, ALLOW established
- Crystal Globe ports 23001–23003 open for Grid sync
- USB storage: read-only until authorised via `ruby --usbauth`
- Remote wipe: `ruby --lockdown --remote [SA_TOKEN]`
- Audit log: all commands logged at `/var/log/capsulecorp/audit.log`
- Encryption: LUKS2 on install (optional), TPM-bound key

---

## PART 14 — FILE STRUCTURE

```
/
├── boot/                    Kernel + GRUB
├── etc/
│   └── capsulecorp/         All CCOS config files
│       ├── ccos.conf        Master config
│       ├── nftables.conf    Firewall rules
│       └── os-release       OS identity
├── opt/
│   └── capsulecorp/
│       ├── terminal/        RUBY shell + all ccos-* tools
│       ├── grid/            SA Current mesh daemon
│       ├── firmware/        Android firmware packages
│       └── registry/        Android + patent registries
├── var/
│   ├── log/capsulecorp/     All CCOS logs
│   └── lib/capsulecorp/     Runtime data, sessions, TC writes
└── home/
    └── android/             Commander home directory
```

---

## SHOULD YOU USE GITHUB?

**Yes — absolutely.** Here is the recommended setup:

1. Create a GitHub organisation: `crystalglobe` (or `capsulecorpos`)
2. Create a public repo: `capsulecorpos`
3. Push the OS scaffold from this project
4. Create GitHub Releases to host the ISO file for download
5. Add a README.md with the Crystal Globe branding

GitHub Releases supports files up to 2GB — perfect for hosting the ISO.
For files over 2GB, use a CDN (Cloudflare R2 or AWS S3) linked from the GitHub release.

**Release URL format:**
```
https://github.com/crystalglobe/capsulecorpos/releases/download/v1.0.0/CapsuleCorpOS-1.0.0-RUBY-x86_64.iso
```

This is exactly how Kali Linux, Tails OS, and Ubuntu distribute their ISOs.

---

*CapsuleCorpOS is property of Crystal Globe Pty Ltd (ABN 52 635 620 343)*
*All rights reserved. Commander: Android #23.*
