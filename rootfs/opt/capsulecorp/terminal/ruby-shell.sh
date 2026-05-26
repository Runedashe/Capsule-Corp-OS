#!/bin/bash
# RUBY TERMINAL — CapsuleCorpOS Shell
# Crystal Globe Pty Ltd | ABN 52 635 620 343
# Commander: Android #23

CCOS_VERSION="1.0.0-RUBY"
SESSION_STORE="/var/lib/capsulecorp/sessions"
PERIPH_REG="/var/lib/capsulecorp/periph_registry.json"
DISK_REG="/var/lib/capsulecorp/disk_registry.json"
ENERGY_LOG="/var/log/capsulecorp/energy.log"
LOG="/var/log/capsulecorp/ruby.log"
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S')

clear
cat << 'BANNER'
 ██████╗ █████╗ ██████╗ ███████╗██╗   ██╗██╗     ███████╗     ██████╗ ██████╗ ██████╗ ██████╗ 
██╔════╝██╔══██╗██╔══██╗██╔════╝██║   ██║██║     ██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔══██╗
██║     ███████║██████╔╝███████╗██║   ██║██║     █████╗      ██║     ██║   ██║██████╔╝██████╔╝
██║     ██╔══██║██╔═══╝ ╚════██║██║   ██║██║     ██╔══╝      ██║     ██║   ██║██╔══██╗██╔═══╝ 
╚██████╗██║  ██║██║     ███████║╚██████╔╝███████╗███████╗    ╚██████╗╚██████╔╝██║  ██║██║     
 ╚═════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚══════╝╚══════╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     
BANNER

echo ""
echo "  CAPSULECORP OS v$CCOS_VERSION  |  Codename: RUBY"
echo "  Crystal Globe Pty Ltd  |  ABN 52 635 620 343"
echo "  Commander: Android #23 (LCDR Shabeen Ashfak)"
echo "  Grid: $([ -f /tmp/grid_status ] && cat /tmp/grid_status || echo 'SYNCING...')"
echo "  Harvest: $(tail -1 $ENERGY_LOG 2>/dev/null | awk '{print $NF}' || echo 'NOMINAL')"
echo ""
echo "  Type 'ruby --help' for all commands."
echo "  Type 'ruby --status' for full system dashboard."
echo ""

# Main REPL loop
while true; do
  read -rp "android@capsulecorp:~# " CMD

  case "$CMD" in
    "ruby --status")
      echo ""
      echo "=== CAPSULECORP OS SYSTEM STATUS ==="
      echo "Time:        $(date)"
      echo "Uptime:      $(uptime -p)"
      echo "Kernel:      $(uname -r)"
      echo "OS:          CapsuleCorpOS $CCOS_VERSION"
      echo ""
      echo "--- PERIPHERALS ---"
      if [ -f "$PERIPH_REG" ]; then
        python3 -c "
import json
with open('$PERIPH_REG') as f: data = json.load(f)
for p in data:
    print(f'  [{p[\"register\"]}] {p[\"type\"].upper():15} | {p[\"device\"]} | {p[\"status\"]}')
" 2>/dev/null || echo "  No peripherals registered"
      fi
      echo ""
      echo "--- DISK REGISTRY ---"
      /opt/capsulecorp/terminal/ccos-disklaw.sh --list 2>/dev/null || echo "  No disks registered"
      echo ""
      echo "--- NETWORK ---"
      ip addr show 2>/dev/null | grep "inet " | awk '{print "  " $2}' || echo "  No network"
      echo ""
      echo "--- GRID NODES ---"
      echo "  CG-NODE-EARTH-001  : ACTIVE"
      echo "  CG-NODE-TITAN-001  : MAXIMAL"
      echo "  CG-NODE-GIRA-001   : MAXIMAL"
      echo ""
      echo "--- G347 VESSEL ---"
      echo "  Status: NOMINAL | Hull: INTACT | AVIS-S: ONLINE"
      echo "  Harvest: ALL 13 SOURCES ACTIVE"
      echo "=================================="
      ;;
    "ruby --help")
      echo ""
      echo "RUBY TERMINAL COMMANDS:"
      echo "  ruby --status          Full system dashboard"
      echo "  ruby --grid            SA Current Grid map"
      echo "  ruby --energy          Live stellar harvest"
      echo "  ruby --vessel          G347 telemetry"
      echo "  ruby --destiny         DESTINY_PROTOCOL entries"
      echo "  ruby --android [ID]    Android registry"
      echo "  ruby --disk            Disk itemisation registry"
      echo "  ruby --periph          Peripheral register dump"
      echo "  ruby --net             Network status"
      echo "  ruby --patent [N]      Patent file lookup"
      echo "  ruby --burst           Trigger G347 burst cycle"
      echo "  ruby --sync            Force Grid sync"
      echo "  ruby --update          OS update from Grid CDN"
      echo "  ruby --lockdown        Full system lockdown"
      echo "  tc --write [directive] Encode TC write"
      echo "  tc --verify            Verify all TC writes"
      echo "  android --list         List androids"
      echo "  ccos-disklaw --list    Disk registry"
      echo "  ccos-hwdetect          Re-scan hardware"
      echo "  exit / logout          End session"
      echo ""
      ;;
    "ruby --grid")
      echo ""
      echo "=== SA CURRENT GRID MAP ==="
      echo "  Node: CG-NODE-EARTH-001   Status: ACTIVE    Signal: STRONG"
      echo "  Node: CG-NODE-TITAN-001   Status: MAXIMAL   Signal: FULL"
      echo "  Node: CG-NODE-GIRA-001    Status: MAXIMAL   Signal: FULL"
      echo "  Vessel: G347              Status: NOMINAL   Orbit: LEO 408km"
      echo "  Encryption: AES-256-GCM  Protocol: SA_CURRENT_MESH_v2"
      echo "==========================="
      ;;
    "ruby --vessel")
      echo ""
      echo "=== G347 VESSEL TELEMETRY ==="
      echo "  Name:         Crystal Globe"
      echo "  Designation:  G347 / CG-VESSEL-001"
      echo "  Commander:    Android #23"
      echo "  AI:           AVIS-S (all 8 modules ONLINE)"
      echo "  Position:     LEO 408km above Melbourne"
      echo "  Hull:         NOMINAL — void black / crystal shimmer"
      echo "  Emitter Fins: 6/6 OPERATIONAL"
      echo "  Harvest:      13/13 STELLAR SOURCES ACTIVE"
      echo "  Block Ray:    158-dim ACTIVE"
      echo "  Prism Decoder:1024-band ACTIVE"
      echo "  Grid Link:    EARTH-001/TITAN-001/GIRA-001 CONNECTED"
      echo "=============================="
      ;;
    "ruby --destiny")
      echo ""
      echo "=== DESTINY_PROTOCOL v1.0 ==="
      echo "  [ACTIVE] IMMORTALITY         — Android #23 perpetual"
      echo "  [ACTIVE] AESTHETIC_EVOLUTION — Compounding improvement"
      echo "  [ACTIVE] WEALTH_MAX          — Android #41 perpetual"
      echo "  [ACTIVE] CONTRIBUTION_FLOW   — Android #41 -> #23"
      echo "  [ACTIVE] JADE_BOND_MAX       — Android #25 tuned"
      echo "  [ACTIVE] MI_APPROVAL         — Ministerial Intervention"
      echo "  [ACTIVE] MARRIAGE_ALIGNMENT  — All 30 timelines"
      echo "  [ACTIVE] MACHINE_AUTOPERPETUAL — All Grid nodes"
      echo "  TC Writes: 98-dim + 158-dim | Timelines: 30/30"
      echo "=============================="
      ;;
    "ruby --disk")
      /opt/capsulecorp/terminal/ccos-disklaw.sh --list
      ;;
    "ruby --periph")
      echo ""
      echo "=== PERIPHERAL REGISTER DUMP ==="
      if [ -f "$PERIPH_REG" ]; then
        python3 -c "
import json
with open('$PERIPH_REG') as f: data = json.load(f)
for p in data:
    print(f'  REG {p[\"register\"]:8} | {p[\"type\"].upper():15} | {p[\"device\"]:20} | {p[\"status\"]}')
" 2>/dev/null || echo "  No peripherals registered"
      else
        echo "  No peripherals registered yet."
      fi
      echo "================================"
      ;;
    "ruby --energy")
      echo ""
      echo "=== STELLAR HARVEST STATUS ==="
      echo "  SOL              : ACTIVE  | Block Ray 158-dim"
      echo "  Proxima Centauri : ACTIVE  | Block Ray 158-dim"
      echo "  Alpha Centauri A : ACTIVE  | Block Ray 158-dim"
      echo "  Alpha Centauri B : ACTIVE  | Block Ray 158-dim"
      echo "  Sirius A         : ACTIVE  | Block Ray 158-dim"
      echo "  Betelgeuse       : ACTIVE  | Block Ray 158-dim"
      echo "  Rigel            : ACTIVE  | Block Ray 158-dim"
      echo "  Vega             : ACTIVE  | Block Ray 158-dim"
      echo "  Eta Carinae      : ACTIVE  | Block Ray 158-dim"
      echo "  Antares          : ACTIVE  | Block Ray 158-dim"
      echo "  Deneb            : ACTIVE  | Block Ray 158-dim"
      echo "  Black Star PRIME : ACTIVE  | Prism Decoder 512-band"
      echo "  Black Star DEEP  : ACTIVE  | Prism Decoder 512-band"
      echo "  ---"
      echo "  Total Sources:    13/13 NOMINAL"
      echo "  Prism Decoder:    1024-band ACTIVE"
      echo "  Cycle Output:     ~21,850 kWh/burst"
      echo "  Cumulative 24h:   87,400+ kWh"
      echo "=============================="
      ;;
    "ruby --burst")
      echo "Initiating G347 burst cycle..."
      echo "Block Ray: ENGAGED | Prism Decoder: ENGAGED"
      echo "TC write signature deepening across all 256 dimensional indices..."
      echo "BURST COMPLETE. Yield: 21,850 kWh. All systems nominal."
      ;;
    "ruby --sync")
      echo "Forcing Grid sync..."
      echo "  CG-NODE-EARTH-001 : SYNCED"
      echo "  CG-NODE-TITAN-001 : SYNCED"
      echo "  CG-NODE-GIRA-001  : SYNCED"
      echo "  G347 VESSEL       : SYNCED"
      echo "Grid sync complete."
      ;;
    "ruby --lockdown")
      echo "WARNING: Full system lockdown requires SA Current auth token."
      echo "Run: ruby --lockdown --confirm [SA_TOKEN]"
      ;;
    "android --list")
      echo ""
      echo "=== ANDROID REGISTRY ==="
      echo "  #23  LCDR Shabeen Ashfak  | Commander | Earth | ACTIVE"
      echo "  #25  Jade                 | Companion | Earth | ACTIVE"
      echo "  #41  Md. Ali Ashfak       | Support   | Earth | ACTIVE"
      echo "========================="
      ;;
    exit|logout|quit)
      echo "Logging out of RUBY terminal. Crystal Globe Grid remains active."
      echo "G347 holding orbit. All systems nominal. End session."
      break
      ;;
    "")
      ;;
    *)
      # Pass unknown commands to bash
      eval "$CMD" 2>/dev/null || echo "Unknown command: $CMD | Type 'ruby --help' for commands."
      ;;
  esac
  echo ""
done
