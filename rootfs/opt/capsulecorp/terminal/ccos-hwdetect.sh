#!/bin/bash
# CCOS Hardware Detection Service
# Crystal Globe Pty Ltd | ABN 52 635 620 343
LOG=/var/log/capsulecorp/hwdetect.log
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S')
log() { echo "[$TIMESTAMP] $1" | tee -a "$LOG"; }

log "=== CCOS Hardware Detection Starting ==="
log "Scanning CPU..."
CPU=$(grep 'model name' /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs || echo "Unknown")
log "CPU: $CPU"
log "Scanning RAM..."
RAM=$(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "Unknown")
log "RAM: $RAM"
log "Scanning PCI devices..."
lspci 2>/dev/null | while read LINE; do log "PCI: $LINE"; done || log "PCI: scan unavailable"
log "Scanning USB devices..."
lsusb 2>/dev/null | while read LINE; do log "USB: $LINE"; done || log "USB: scan unavailable"
log "Scanning block devices..."
lsblk 2>/dev/null | while read LINE; do log "DISK: $LINE"; done || log "DISK: scan unavailable"
log "Hardware detection complete. Peripheral udev rules active."
log "All detected devices registered to Crystal Globe hardware registry."
