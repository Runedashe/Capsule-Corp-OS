#!/bin/bash
# CAPSULE CORP OS — ISO Build Script
# Builds CapsuleCorpOS-1.0.0-RUBY-x86_64.iso
# Crystal Globe Pty Ltd | ABN 52 635 620 343
#
# REQUIREMENTS (run on Ubuntu 22.04/24.04 build host):
#   sudo apt install debootstrap squashfs-tools isolinux syslinux-utils \
#        xorriso grub-pc-bin grub-efi-amd64-bin mtools

set -e

BUILD_DIR=/tmp/ccos_build
CHROOT_DIR=$BUILD_DIR/chroot
ISO_DIR=$BUILD_DIR/iso
OUTPUT_ISO=CapsuleCorpOS-1.0.0-RUBY-x86_64.iso
MIRROR=http://archive.ubuntu.com/ubuntu

echo "=== CAPSULECORP OS ISO BUILD ==="
echo "Version: 1.0.0-RUBY"
echo "Vendor: Crystal Globe Pty Ltd | ABN 52 635 620 343"
echo "================================"

# Step 1: Bootstrap Ubuntu minimal base
echo "[1/8] Bootstrapping Ubuntu 24.04 minimal..."
mkdir -p $CHROOT_DIR
sudo debootstrap --arch=amd64 noble $CHROOT_DIR $MIRROR

# Step 2: Mount pseudo filesystems
echo "[2/8] Mounting chroot filesystems..."
sudo mount --bind /dev $CHROOT_DIR/dev
sudo mount --bind /run $CHROOT_DIR/run
sudo chroot $CHROOT_DIR mount -t proc none /proc
sudo chroot $CHROOT_DIR mount -t sysfs none /sys
sudo chroot $CHROOT_DIR mount -t devpts none /dev/pts

# Step 3: Install required packages in chroot
echo "[3/8] Installing base packages..."
sudo chroot $CHROOT_DIR /bin/bash << 'CHROOT'
  export DEBIAN_FRONTEND=noninteractive
  apt update -q
  apt install -y --no-install-recommends \
    linux-image-generic linux-headers-generic \
    systemd systemd-sysv udev \
    network-manager nftables \
    openssh-server bluez \
    pipewire pipewire-alsa pipewire-pulse alsa-utils \
    v4l-utils pciutils usbutils lsblk blkid \
    cryptsetup curl wget python3 python3-pip \
    git vim nano htop net-tools iproute2 \
    iputils-ping dnsutils squashfs-tools \
    memtest86+ grub-pc grub-efi-amd64-signed shim-signed \
    mesa-utils libdrm2 xserver-xorg-core nodejs npm
  echo "capsulecorp" > /etc/hostname
  useradd -m -s /opt/capsulecorp/terminal/ruby-shell.sh android
  echo "android:CrystalGlobe2347" | chpasswd
  usermod -aG sudo android
  echo "exec /opt/capsulecorp/terminal/ruby-shell.sh" >> /home/android/.bash_profile
CHROOT

# Step 4: Install CCOS files into chroot
echo "[4/8] Installing CapsuleCorpOS files..."
sudo cp -r /app/capsulecorp_os/rootfs/etc/capsulecorp $CHROOT_DIR/etc/
sudo cp -r /app/capsulecorp_os/rootfs/etc/udev/rules.d/9*-ccos-* $CHROOT_DIR/etc/udev/rules.d/
sudo cp -r /app/capsulecorp_os/rootfs/etc/systemd/system/ccos-* $CHROOT_DIR/etc/systemd/system/
sudo cp -r /app/capsulecorp_os/rootfs/etc/systemd/system/capsulecorp.target $CHROOT_DIR/etc/systemd/system/
sudo mkdir -p $CHROOT_DIR/opt/capsulecorp/{terminal,grid,firmware,registry}
sudo cp -r /app/capsulecorp_os/rootfs/opt/capsulecorp/terminal/* $CHROOT_DIR/opt/capsulecorp/terminal/
sudo cp -r /app/capsulecorp_os/rootfs/opt/capsulecorp/grid/* $CHROOT_DIR/opt/capsulecorp/grid/
sudo chmod +x $CHROOT_DIR/opt/capsulecorp/terminal/*.sh
sudo chmod +x $CHROOT_DIR/opt/capsulecorp/grid/*.sh
sudo mkdir -p $CHROOT_DIR/var/{log,lib}/capsulecorp
sudo chroot $CHROOT_DIR systemctl enable capsulecorp.target ccos-hwdetect.service \
  ccos-disklaw.service ccos-sacurrent.service ccos-ruby.service \
  ccos-energy.service ccos-gridsync.service

# Step 5: Create squashfs
echo "[5/8] Creating squashfs compressed filesystem..."
mkdir -p $ISO_DIR/live
sudo mksquashfs $CHROOT_DIR $ISO_DIR/live/filesystem.squashfs \
  -e boot -comp xz -Xbcj x86 -b 1M -noappend

# Step 6: Copy kernel + initrd
echo "[6/8] Copying kernel and initrd..."
mkdir -p $ISO_DIR/boot
cp $CHROOT_DIR/boot/vmlinuz-* $ISO_DIR/boot/vmlinuz
cp $CHROOT_DIR/boot/initrd.img-* $ISO_DIR/boot/initrd.img

# Step 7: Set up ISOLINUX (BIOS) + GRUB EFI (UEFI)
echo "[7/8] Configuring bootloaders..."
mkdir -p $ISO_DIR/isolinux $ISO_DIR/EFI/BOOT
cp /usr/lib/ISOLINUX/isolinux.bin $ISO_DIR/isolinux/
cp /usr/lib/syslinux/modules/bios/{menu.c32,libutil.c32} $ISO_DIR/isolinux/
cp /app/capsulecorp_os/isolinux/isolinux.cfg $ISO_DIR/isolinux/
grub-mkstandalone --format=x86_64-efi \
  --output=$ISO_DIR/EFI/BOOT/BOOTX64.EFI \
  "boot/grub/grub.cfg=/app/capsulecorp_os/boot/grub.cfg"

# Step 8: Pack into ISO with xorriso
echo "[8/8] Packing ISO with xorriso..."
xorriso -as mkisofs \
  -iso-level 3 \
  -full-iso9660-filenames \
  -volid "CAPSULECORP_OS" \
  -eltorito-boot isolinux/isolinux.bin \
  -eltorito-catalog isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  --eltorito-alt-boot \
  -e EFI/BOOT/BOOTX64.EFI \
  -no-emul-boot \
  -isohybrid-gpt-basdat \
  -output /app/$OUTPUT_ISO \
  $ISO_DIR

echo ""
echo "=== BUILD COMPLETE ==="
echo "Output: /app/$OUTPUT_ISO"
echo "To flash to USB, use Balena Etcher (Windows/Mac/Linux) or Rufus (Windows)."
echo "  Balena Etcher: https://www.balena.io/etcher/"
echo "  Rufus: https://rufus.ie/"
echo "======================"
