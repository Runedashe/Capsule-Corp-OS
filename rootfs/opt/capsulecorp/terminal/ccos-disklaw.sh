#!/bin/bash
# CCOS Disk Itemisation Law Engine — CG-SIL v1.0
# Crystal Globe Pty Ltd | ABN 52 635 620 343

REGISTRY=/var/lib/capsulecorp/disk_registry.json
LOG=/var/log/capsulecorp/disklaw.log
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S')

log() { echo "[$TIMESTAMP] $1" >> "$LOG"; }

auto_register() {
  local DEV=$1
  local PATH="/dev/$DEV"
  if [ ! -b "$PATH" ]; then log "Device $PATH not found"; exit 1; fi

  local UUID=$(blkid -s UUID -o value "$PATH" 2>/dev/null || cat /proc/sys/kernel/random/uuid)
  local SERIAL=$(udevadm info "$PATH" 2>/dev/null | grep ID_SERIAL_SHORT | cut -d= -f2 || echo "UNKNOWN")
  local SIZE=$(lsblk -bnd -o SIZE "$PATH" 2>/dev/null || echo "0")
  local MODEL=$(udevadm info "$PATH" 2>/dev/null | grep ID_MODEL= | cut -d= -f2 || echo "UNKNOWN")
  local HASH=$(dd if="$PATH" bs=512 count=1 2>/dev/null | sha512sum | awk '{print $1}')
  local DISK_ID="CG-DISK-$(echo $UUID | tr -d '-' | head -c 12 | tr '[:lower:]' '[:upper:]')"

  log "AUTO-REGISTERING: $DEV | UUID: $UUID | Model: $MODEL | Size: $SIZE bytes"

  # Write entry to registry
  python3 -c "
import json, os
reg = '$REGISTRY'
entry = {
  'DISK_ID': '$DISK_ID',
  'DISK_TAG': 'CG-UNTAGGED-$DEV',
  'DISK_CLASS': 'DATA',
  'DISK_OWNER': 'Android #23',
  'DISK_DEVICE': '/dev/$DEV',
  'DISK_UUID': '$UUID',
  'DISK_SERIAL': '$SERIAL',
  'DISK_MODEL': '$MODEL',
  'DISK_SIZE_BYTES': '$SIZE',
  'DISK_HASH': '$HASH',
  'DISK_SEAL': 'TC_WRITE_98DIM_158DIM',
  'DISK_RIGHTS': 'READ|WRITE|EXECUTE',
  'DISK_REGISTERED': '$TIMESTAMP',
  'CG_SIL_VERSION': '1.0'
}
data = []
if os.path.exists(reg):
    try:
        with open(reg) as f: data = json.load(f)
    except: data = []
data.append(entry)
with open(reg, 'w') as f: json.dump(data, f, indent=2)
print('Registered: ' + entry['DISK_ID'])
"
  log "DISK REGISTERED: $DISK_ID"
}

list_disks() {
  echo "=== CAPSULE CORP OS — DISK ITEMISATION REGISTRY ==="
  echo "=== CG-SIL v1.0 | Crystal Globe Pty Ltd ==="
  echo ""
  if [ -f "$REGISTRY" ]; then
    python3 -c "
import json
with open('$REGISTRY') as f: data = json.load(f)
for d in data:
    print(f'DISK ID:    {d[\"DISK_ID\"]}')
    print(f'Tag:        {d[\"DISK_TAG\"]}')
    print(f'Class:      {d[\"DISK_CLASS\"]}')
    print(f'Owner:      {d[\"DISK_OWNER\"]}')
    print(f'Device:     {d[\"DISK_DEVICE\"]}')
    print(f'Model:      {d[\"DISK_MODEL\"]}')
    size_gb = int(d.get('DISK_SIZE_BYTES','0')) / 1e9
    print(f'Size:       {size_gb:.1f} GB')
    print(f'Seal:       {d[\"DISK_SEAL\"]}')
    print(f'Rights:     {d[\"DISK_RIGHTS\"]}')
    print(f'Registered: {d[\"DISK_REGISTERED\"]}')
    print('---')
"
  else
    echo "No disks registered yet."
  fi
}

case "$1" in
  auto-register) auto_register "$2" ;;
  --register)    auto_register "$2" ;;
  --list)        list_disks ;;
  --verify)      echo "Verifying $2..." && sha512sum "$2" ;;
  --deregister)  echo "Deregister requires --confirm flag" ;;
  *) echo "Usage: ccos-disklaw [auto-register|--register|--list|--verify|--deregister] [device]" ;;
esac
