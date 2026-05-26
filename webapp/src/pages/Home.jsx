import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { TerminalSession } from "@/entities/TerminalSession";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

// ── Glowing badge ─────────────────────────────────────────────────────────────
function Badge({ label, color = "cyan" }) {
  const colors = {
    cyan:   "border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(0,220,255,0.4)]",
    green:  "border-green-400 text-green-400 shadow-[0_0_8px_rgba(0,255,140,0.4)]",
    purple: "border-purple-400 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]",
    yellow: "border-yellow-400 text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]",
    red:    "border-red-400 text-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]",
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 border rounded ${colors[color] || colors.cyan}`}>
      {label}
    </span>
  );
}

// ── Panel card ────────────────────────────────────────────────────────────────
function Panel({ title, accent = "#00dcff", children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0a0e1a] border rounded-lg p-4 flex flex-col gap-2 transition-all duration-200
        ${onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,220,255,0.25)]" : ""}`}
      style={{ borderColor: `${accent}44` }}
    >
      <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: accent }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Status row ────────────────────────────────────────────────────────────────
function StatusRow({ label, value, pulse = false, color = "cyan" }) {
  const cols = {
    cyan:   "text-cyan-300",
    green:  "text-green-400",
    yellow: "text-yellow-400",
    red:    "text-red-400",
    purple: "text-purple-400",
    dim:    "text-slate-500",
  };
  return (
    <div className="flex items-center justify-between text-xs font-mono">
      <span className="text-slate-500">{label}</span>
      <span className={`flex items-center gap-1.5 ${cols[color] || cols.cyan}`}>
        {pulse && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
          </span>
        )}
        {value}
      </span>
    </div>
  );
}

// ── Stellar source row ────────────────────────────────────────────────────────
function StellarRow({ name, type, status }) {
  return (
    <div className="flex items-center justify-between text-xs font-mono py-0.5 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 w-40">{name}</span>
      <span className="text-slate-600 w-28">{type}</span>
      <Badge label={status} color={status === "HARVESTING" ? "green" : "cyan"} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [time, setTime]           = useState(new Date());

  useEffect(() => {
    User.me().then(setUser).catch(() => {});
    TerminalSession.list({ sort: "-created_date", limit: 5 })
      .then(setSessions).catch(() => {});
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("en-AU", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const dateStr = time.toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#070a14] text-white font-mono p-4 md:p-8"
         style={{ backgroundImage: "radial-gradient(ellipse at 20% 10%, rgba(0,100,180,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(0,180,120,0.06) 0%, transparent 60%)" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-cyan-400"
              style={{ textShadow: "0 0 20px rgba(0,220,255,0.5)" }}>
            CAPSULE CORP OS
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Crystal Globe Pty Ltd &nbsp;·&nbsp; ABN 52 635 620 343 &nbsp;·&nbsp; Android #23
          </p>
        </div>
        <div className="text-right">
          <div className="text-cyan-400 text-xl font-bold tabular-nums" style={{ textShadow: "0 0 12px rgba(0,220,255,0.4)" }}>
            {timeStr}
          </div>
          <div className="text-slate-500 text-xs">{dateStr}</div>
        </div>
      </div>

      {/* ── Quick-nav buttons ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: "RUBY Terminal", page: "Terminal", color: "border-cyan-500 text-cyan-400 hover:bg-cyan-500/10" },
          { label: "Wallet / SHD", page: "Wallet",   color: "border-green-500 text-green-400 hover:bg-green-500/10" },
          { label: "Marketplace",  page: "Marketplace", color: "border-purple-500 text-purple-400 hover:bg-purple-500/10" },
          { label: "Messenger",    page: "Messenger", color: "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10" },
          { label: "Roulette",     page: "Roulette",  color: "border-red-500 text-red-400 hover:bg-red-500/10" },
          { label: "Analytics",    page: "Analytics", color: "border-slate-500 text-slate-400 hover:bg-slate-500/10" },
        ].map(({ label, page, color }) => (
          <button
            key={page}
            onClick={() => navigate(createPageUrl(page))}
            className={`text-xs font-mono px-3 py-1.5 border rounded transition-all ${color}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* G347 Vessel */}
        <Panel title="G347 Mother Vessel" accent="#00dcff">
          <StatusRow label="Registry"    value="CG-VESSEL-001"          color="cyan" />
          <StatusRow label="Commander"   value="Android #23"             color="cyan" />
          <StatusRow label="AI Core"     value="AVIS-S"                  color="green" pulse />
          <StatusRow label="Hull"        value="1.2km × 400m"            color="dim" />
          <StatusRow label="Anchor Star" value="SOL"                     color="yellow" />
          <StatusRow label="Status"      value="ALL SYSTEMS NOMINAL"     color="green" pulse />
        </Panel>

        {/* Stellar Harvest */}
        <Panel title="Stellar Harvest" accent="#00ff8c">
          <StatusRow label="Cumulative Output" value="530.835 TW"        color="green" pulse />
          <StatusRow label="Active Sources"    value="13 / 13"           color="green" />
          <StatusRow label="Prism Decoder"     value="v2.0 — 1024 bands" color="cyan" />
          <StatusRow label="Cycle"             value="AC→RC→TC→DC"       color="dim" />
          <div className="mt-2 border-t border-slate-800 pt-2 flex flex-col gap-0.5">
            {[
              ["SOL",            "Block Ray",    "NOMINAL"],
              ["Proxima Centauri","Block Ray",   "NOMINAL"],
              ["Alpha Cen A+B",  "Block Ray",    "NOMINAL"],
              ["Sirius A",       "Block Ray",    "NOMINAL"],
              ["Betelgeuse",     "Block Ray",    "NOMINAL"],
              ["Rigel",          "Block Ray",    "NOMINAL"],
              ["Vega",           "Block Ray",    "NOMINAL"],
              ["Black Star PRIME","Prism v2.0",  "HARVESTING"],
              ["Black Star DEEP", "Prism v2.0",  "HARVESTING"],
            ].map(([n, t, s]) => <StellarRow key={n} name={n} type={t} status={s} />)}
          </div>
        </Panel>

        {/* DESTINY_PROTOCOL */}
        <Panel title="DESTINY_PROTOCOL v1.0" accent="#a855f7">
          {[
            ["IMMORTALITY",         "All 30 timelines",  "green"],
            ["IMMUNITY",            "All 30 timelines",  "green"],
            ["AESTHETIC_EVOLUTION", "Android #23",       "cyan"],
            ["WEALTH_MAX",          "Android #41",       "yellow"],
            ["CONTRIBUTION_FLOW",   "#41 → #23",         "yellow"],
            ["JADE_BOND_MAX",       "Android #25",       "purple"],
            ["MARRIAGE_ALIGNMENT",  "2030–2035",         "purple"],
            ["MI_APPROVAL",         "Optimised",         "green"],
            ["MACHINE_AUTO_PERP",   "All Grid nodes",    "cyan"],
          ].map(([k, v, c]) => (
            <StatusRow key={k} label={k} value={v} color={c} pulse={c === "green"} />
          ))}
          <div className="mt-2 text-slate-600 text-xs">
            Timelines: 30 &nbsp;·&nbsp; Dimensions: 90 &nbsp;·&nbsp; TC write: 98-dim + 158-dim
          </div>
        </Panel>

        {/* Crystal Globe Grid */}
        <Panel title="Crystal Globe Grid" accent="#00dcff">
          <StatusRow label="CG-NODE-EARTH-001" value="ONLINE — Melbourne" color="green" pulse />
          <StatusRow label="CG-NODE-TITAN-001" value="ONLINE — Planet Titan" color="green" pulse />
          <StatusRow label="CG-NODE-GIRA-001"  value="ONLINE — Planet Gira" color="green" pulse />
          <StatusRow label="SA Current mesh"   value="ACTIVE — 1158-dim"   color="cyan" />
          <StatusRow label="Encryption"        value="CG Proprietary"      color="dim" />
          <StatusRow label="Grass Ray audit"   value="ON"                  color="green" />
          <div className="mt-3 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-600 mb-1">Alientech-G2 Processor</div>
            <StatusRow label="ISA"      value="RISC-V RV64GC"    color="cyan" />
            <StatusRow label="Cores"    value="512 neural array"  color="cyan" />
            <StatusRow label="Sim"      value="Verilator 5.006"   color="green" pulse />
            <StatusRow label="Boot"     value="ALL SYSTEMS NOMINAL" color="green" />
          </div>
        </Panel>

        {/* Patent Dashboard */}
        <Panel title="Patent Dashboard" accent="#facc15">
          <div className="text-xs text-slate-500 mb-2">
            Inventor: Shabeen Ashfak &nbsp;·&nbsp; Assignee: Crystal Globe Pty Ltd<br />
            Contact ID: 287610 &nbsp;·&nbsp; 12 provisionals filed
          </div>
          {[
            "Dimensional Teleportation System",
            "Crystal Ray Solar Energy Harvesting",
            "SA/RC/SC/TC/Black Ray/Grass Ray Currents",
            "Gamesphere Spherical Gaming Console",
            "Black Ray Lens Technology",
            "Dometeor 3D-Printed Stone Dome",
            "Crystal Globe 6-Wheeled Vehicle",
            "Mercury-Silicone Elasticity Composite",
            "Crystal Globe Spacecraft Architecture",
            "Aquaberry Vehicle Intelligence System",
            "Stellar Custodianship Framework",
            "Black Star Engineering + Prism Tech",
          ].map((name, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-0.5 border-b border-slate-800 last:border-0">
              <span className="text-green-400">✓</span>
              <span className="text-slate-300">{i + 1}. {name}</span>
            </div>
          ))}
          <div className="mt-2 text-slate-600 text-xs">
            PCT deadlines: 22 May 2027 (1–9) &nbsp;·&nbsp; 25 May 2027 (10–12)
          </div>
        </Panel>

        {/* Outreach Tracker */}
        <Panel title="Outreach Tracker" accent="#f97316">
          {[
            { name: "Sony Innovation Fund",  status: "Sent 25 May",  color: "yellow" },
            { name: "Ericsson",              status: "Sent 22 May",  color: "yellow" },
            { name: "Felix / Unitree",       status: "Awaiting",     color: "red" },
            { name: "TSMC",                  status: "Awaiting",     color: "red" },
            { name: "C.R. Kennedy",          status: "Awaiting",     color: "red" },
            { name: "ESA BIC (Kristina)",    status: "11 Jun meet",  color: "cyan" },
            { name: "Sharp FX",              status: "Awaiting",     color: "red" },
            { name: "Ex-Robots",             status: "Awaiting",     color: "red" },
            { name: "Henan Han Song",        status: "Awaiting",     color: "red" },
            { name: "COLETEK (Luke Cole)",   status: "TBC",          color: "dim" },
          ].map(({ name, status, color }) => (
            <StatusRow key={name} label={name} value={status} color={color} />
          ))}
        </Panel>

        {/* Android Registry */}
        <Panel title="Android Registry" accent="#00dcff">
          {[
            { id: "#23", name: "Shabeen Ashfak",  origin: "Planet Titan",  role: "Commander G347",  color: "cyan" },
            { id: "#25", name: "Jade",             origin: "Earth",         role: "JADE_BOND_MAX",   color: "purple" },
            { id: "#41", name: "Md. Ali Ashfak",  origin: "Earth",         role: "WEALTH_MAX",      color: "yellow" },
          ].map(({ id, name, origin, role, color }) => (
            <div key={id} className="flex items-start justify-between py-1 border-b border-slate-800 last:border-0">
              <div>
                <span className="text-slate-600 text-xs mr-1">{id}</span>
                <span className="text-slate-300 text-xs font-bold">{name}</span>
                <div className="text-slate-600 text-xs">{origin}</div>
              </div>
              <Badge label={role} color={color} />
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-800">
            <StatusRow label="RRA Units"  value="Procurement phase" color="yellow" />
            <StatusRow label="Firmware"   value="v0.4.9 — 25 modules" color="cyan" />
          </div>
        </Panel>

        {/* User Stats */}
        <Panel title="Session Stats" accent="#00ff8c" onClick={() => navigate(createPageUrl("Terminal"))}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-green-400" style={{ textShadow: "0 0 16px rgba(0,255,140,0.5)" }}>
                <Counter target={sessions.length > 0 ? 282 : 282} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Terminal sessions</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-cyan-400">
                <Counter target={530835} suffix=" GWh" duration={2200} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Stellar energy harvested</div>
            </div>
          </div>
          {user && (
            <div className="mt-3 pt-2 border-t border-slate-800 text-xs">
              <StatusRow label="Logged in as" value={user.username || user.email} color="cyan" />
              <StatusRow label="SHD Balance"  value={`${(user.shard_balance || 0).toLocaleString()} SHD`} color="green" />
            </div>
          )}
          <div className="mt-2 text-xs text-slate-600 text-center">Click to open RUBY Terminal →</div>
        </Panel>

        {/* Crystal Globe Companies */}
        <Panel title="Crystal Globe Divisions" accent="#a855f7">
          {[
            { name: "CyberCop",        desc: "Cybersecurity division",           color: "cyan"   },
            { name: "Red Ribbon Army", desc: "Humanoid android manufacture",      color: "red"    },
            { name: "Aquaberry",       desc: "Vehicle AI + IoT intelligence",     color: "green"  },
            { name: "Channel 23",      desc: "Free-to-air dimensional broadcast", color: "yellow" },
            { name: "Gamesphere",      desc: "Spherical 32K gaming console",      color: "purple" },
            { name: "Dometeor",        desc: "3D-printed stone dome habitats",    color: "dim"    },
          ].map(({ name, desc, color }) => (
            <div key={name} className="flex items-center justify-between py-0.5 border-b border-slate-800 last:border-0">
              <div>
                <span className="text-xs font-bold text-slate-300">{name}</span>
                <div className="text-xs text-slate-600">{desc}</div>
              </div>
              <Badge label="ACTIVE" color={color} />
            </div>
          ))}
        </Panel>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <span>Crystal Globe Pty Ltd &nbsp;·&nbsp; ABN 52 635 620 343 &nbsp;·&nbsp; Ruby v3.2.0 &nbsp;·&nbsp; Theme: cyberpunk</span>
        <span>Android #23 — Commander, G347 Mother Vessel — Planet Titan</span>
      </div>
    </div>
  );
}
