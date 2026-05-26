#!/bin/bash
# CCOS Peripheral Registration Engine
# Crystal Globe Pty Ltd | ABN 52 635 620 343

REG_STORE=/var/lib/capsulecorp/periph_registry.json
LOG=/var/log/capsulecorp/peripherals.log
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S')

PERIPH_TYPE=$1
DEVICE_ID=$2

declare -A REG_ADDR=(
  ["keyboard"]="0xA001"
  ["mouse"]="0xA002"
  ["touchpad"]="0xA002"
  ["display"]="0xA003"
  ["display_hotplug"]="0xA003"
  ["audio"]="0xA004"
  ["usb_audio"]="0xA004"
  ["camera"]="0xA008"
  ["bluetooth"]="0xA007"
  ["usb"]="0xA006"
)

ADDR=${REG_ADDR[$PERIPH_TYPE]:-"0xAFFF"}

echo "[$TIMESTAMP] PERIPH REGISTERED: $PERIPH_TYPE | Device: $DEVICE_ID | Register: $ADDR" >> "$LOG"

python3 -c "
import json, os
store = '$REG_STORE'
entry = {
  'type': '$PERIPH_TYPE',
  'device': '$DEVICE_ID',
  'register': '$ADDR',
  'timestamp': '$TIMESTAMP',
  'status': 'ACTIVE'
}
data = []
if os.path.exists(store):
    try:
        with open(store) as f: data = json.load(f)
    except: data = []
# Remove stale entry for same device
data = [x for x in data if x.get('device') != '$DEVICE_ID']
data.append(entry)
with open(store, 'w') as f: json.dump(data, f, indent=2)
" 2>/dev/null

# Send notification to RUBY terminal
echo "PERIPH:REGISTERED:$PERIPH_TYPE:$DEVICE_ID:$ADDR" >> /tmp/ccos_events.fifo 2>/dev/null || true
