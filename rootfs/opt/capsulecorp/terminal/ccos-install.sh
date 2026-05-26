#!/bin/bash
# CAPSULECORP OS INSTALLER
# Crystal Globe Pty Ltd | ABN 52 635 620 343
# Runs on first boot when ccos.mode=install

clear
cat << 'BANNER'
  ██████╗ ██████╗ ██████╗ ███████╗    ██╗███╗   ██╗███████╗████████╗ █████╗ ██╗     ██╗     
 ██╔════╝██╔════╝██╔═══██╗██╔════╝    ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██║     ██║     
 ██║     ██║     ██║   ██║███████╗    ██║██╔██╗ ██║███████╗   ██║   ███████║██║     ██║     
 ██║     ██║     ██║   ██║╚════██║    ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║     ██║     
 ╚██████╗╚██████╗╚██████╔╝███████║    ██║██║ ╚████║███████║   ██║   ██║  ██║███████╗███████╗
  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝
BANNER

echo ""
echo "  Welcome to CapsuleCorpOS 1.0.0 RUBY Installer"
echo "  Crystal Globe Pty Ltd | ABN 52 635 620 343"
echo "  Commander: Android #23"
echo ""
echo "  WARNING: This will install CapsuleCorpOS to your selected disk."
echo "  Existing data on the target disk will be ERASED."
echo ""

# List available disks
echo "  Available disks:"
lsblk -d -o NAME,SIZE,MODEL 2>/dev/null | grep -v "loop" | while read LINE; do
  echo "    $LINE"
done

echo ""
read -rp "  Enter target disk (e.g. sda, nvme0n1): " TARGET_DISK
TARGET="/dev/$TARGET_DISK"

if [ ! -b "$TARGET" ]; then
  echo "  ERROR: $TARGET not found. Exiting."
  exit 1
fi

echo ""
read -rp "  Set Commander username [android]: " USERNAME
USERNAME=${USERNAME:-android}

read -rsp "  Set Commander password: " PASSWORD
echo ""

read -rp "  Hostname [capsulecorp]: " HOSTNAME
HOSTNAME=${HOSTNAME:-capsulecorp}

echo ""
echo "  === INSTALLATION PLAN ==="
echo "  Target:   $TARGET"
echo "  Username: $USERNAME"
echo "  Hostname: $HOSTNAME"
echo "  Partition scheme:"
echo "    ${TARGET}1  512MB  FAT32  EFI System Partition"
echo "    ${TARGET}2  1GB    ext4   /boot"
echo "    ${TARGET}3  50GB   ext4   / (root)"
echo "    ${TARGET}4  [rest] ext4   /home/$USERNAME"
echo ""
read -rp "  Proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "  Installation cancelled."
  exit 0
fi

echo ""
echo "  [1/6] Partitioning $TARGET with GPT layout..."
parted -s "$TARGET" mklabel gpt
parted -s "$TARGET" mkpart EFI fat32 1MiB 513MiB
parted -s "$TARGET" set 1 esp on
parted -s "$TARGET" mkpart boot ext4 513MiB 1537MiB
parted -s "$TARGET" mkpart root ext4 1537MiB 51737MiB
parted -s "$TARGET" mkpart home ext4 51737MiB 100%
echo "  Partitioning complete."

echo "  [2/6] Formatting partitions..."
# FAT32 for EFI, ext4 for boot/root/home
mkfs.fat -F32 -n EFI "${TARGET}1"
mkfs.ext4 -L ccos-boot -q "${TARGET}2"
mkfs.ext4 -L ccos-root -q "${TARGET}3"
mkfs.ext4 -L ccos-home -q "${TARGET}4"
echo "  Formatting complete."

echo "  [3/6] Mounting target filesystem..."
mount "${TARGET}3" /mnt
mkdir -p /mnt/{boot,home,proc,sys,dev,run,tmp}
mount "${TARGET}2" /mnt/boot
mkdir -p /mnt/boot/efi
mount "${TARGET}1" /mnt/boot/efi
mount "${TARGET}4" /mnt/home
echo "  Mounted."

echo "  [4/6] Copying OS filesystem (this may take several minutes)..."
rsync -ax --info=progress2 \
  --exclude=/proc --exclude=/sys --exclude=/dev --exclude=/run \
  --exclude=/mnt --exclude=/media --exclude=/tmp \
  / /mnt/
echo "  Copy complete."

echo "  [5/6] Installing GRUB bootloader (BIOS + UEFI)..."
# UEFI
grub-install --target=x86_64-efi \
  --efi-directory=/mnt/boot/efi \
  --boot-directory=/mnt/boot \
  --bootloader-id=CapsuleCorpOS \
  --removable 2>/dev/null
# BIOS fallback
grub-install --target=i386-pc \
  --boot-directory=/mnt/boot \
  "$TARGET" 2>/dev/null || true
# Generate GRUB config
grub-mkconfig -o /mnt/boot/grub/grub.cfg
# Copy CCOS GRUB theme
cp /etc/capsulecorp/grub.cfg /mnt/boot/grub/custom.cfg 2>/dev/null || true
echo "  Bootloader installed."

echo "  [6/6] Finalising: creating user + registering disks..."
# Set hostname
echo "$HOSTNAME" > /mnt/etc/hostname
# Create commander user (chroot)
chroot /mnt useradd -m -s /opt/capsulecorp/terminal/ruby-shell.sh "$USERNAME" 2>/dev/null || true
echo "$USERNAME:$PASSWORD" | chroot /mnt chpasswd
chroot /mnt usermod -aG sudo "$USERNAME"
# Register disk under CG-SIL v1.0
/opt/capsulecorp/terminal/ccos-disklaw.sh auto-register "$TARGET_DISK"
echo "  Finalised."

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   INSTALLATION COMPLETE — CAPSULECORPOS     ║"
echo "  ║   Version: 1.0.0 RUBY                       ║"
echo "  ║   Commander: $USERNAME"
echo "  ║   Hostname:  $HOSTNAME"
echo "  ║   Disk:      $TARGET (CG-SIL v1.0 registered)"
echo "  ║                                              ║"
echo "  ║   Remove USB and reboot to launch RUBY.      ║"
echo "  ║   Crystal Globe Grid syncs on first network  ║"
echo "  ║   connection automatically.                  ║"
echo "  ╚══════════════════════════════════════════════╝"
