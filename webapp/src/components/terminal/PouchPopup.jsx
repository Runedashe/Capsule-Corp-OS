import React from "react";
import { X } from "lucide-react";

const POUCH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/9c66856a1_PouchLogo.png";

const getBalanceColor = (balance) => {
  if (balance >= 1_000_000_000) return "text-red-600 bloom-glow"; // 1 billion or over - ruby red
  if (balance >= 1_000_000) return "text-cyan-400 bloom-glow"; // 1 million or over - cyan
  if (balance >= 100_000) return "text-white bloom-glow"; // 100k or over - white
  return "text-yellow-400"; // below 100k - yellow
};

export default function PouchPopup({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-50">
      <div className="bg-black/95 border-2 border-cyan-400 rounded-lg p-4 shadow-2xl min-w-[200px]"
        style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={POUCH_LOGO} alt="Pouch" className="w-8 h-8 object-contain" />
            <span className="text-cyan-400 font-mono font-bold text-sm">SHD POUCH</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className={`text-3xl font-bold font-mono bloom-glow ${getBalanceColor(user?.shard_balance)}`}>
          {user?.shard_balance?.toLocaleString() || '0'}
        </div>
        <div className="text-xs text-gray-400 font-mono mt-1">SHD Balance</div>
      </div>
    </div>
  );
}

export { POUCH_LOGO };