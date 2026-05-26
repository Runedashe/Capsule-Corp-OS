#!/bin/bash
# USB Security Check — called by udev on device add
DEVICE=$1
TRUSTED_DB=/etc/capsulecorp/trusted_usb_devices.json
LOG=/var/log/capsulecorp/usbsec.log
TS=$(date '+%Y-%m-%dT%H:%M:%S')
echo "[$TS] USB device detected: $DEVICE — checking trust DB..." >> "$LOG"
if [ -f "$TRUSTED_DB" ]; then
  if python3 -c "import json,sys; d=json.load(open('$TRUSTED_DB')); exit(0 if '$DEVICE' in d.get('trusted',[]) else 1)" 2>/dev/null; then
    echo "[$TS] $DEVICE: TRUSTED — full access granted" >> "$LOG"
    export CCOS_USB_TRUSTED=1
  else
    echo "[$TS] $DEVICE: UNTRUSTED — read-only enforced. Use: ruby --usbauth $DEVICE" >> "$LOG"
  fi
fi
