import React, { useState, useEffect } from "react";
import { X, Minus } from "lucide-react";
import { User } from "@/entities/User";
import { InvokeLLM } from "@/integrations/Core";
import RouletteGame from "@/components/roulette/RouletteGame";
import ChipPurchaseDialog from "@/components/roulette/ChipPurchaseDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Loader2 } from "lucide-react";

const ROULETTE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/b44039916_Roulettelogo.png";
const CHIPS_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/2c2ab0087_Chips.png";
const PLATINUM_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/1a1beff47_Platinum.png";

export const CHIP_SHD_RATE = 1;
export const PLATINUM_BAR_USD_VALUE = 1000000;

export default function RoulettePopup({ isOpen, isMinimized, onClose, onMinimize, user: propUser }) {
  const [user, setUser] = useState(propUser);
  const [shardPrice, setShardPrice] = useState(0.0001);
  const [showChipDialog, setShowChipDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && propUser) {
      setUser(propUser);
      fetchShardPrice();
    }
  }, [isOpen, propUser]);

  const fetchShardPrice = async () => {
    try {
      const result = await InvokeLLM({
        prompt: "Get the current price of Shard (SHD) cryptocurrency in USD. Return just the current price as a number.",
        add_context_from_internet: true,
        response_json_schema: { type: "object", properties: { price: { type: "number" } } }
      });
      setShardPrice(result.price || 0.0001);
    } catch (error) {
      setShardPrice(0.0001);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const platinumBarShdPrice = shardPrice > 0 ? PLATINUM_BAR_USD_VALUE / shardPrice : 0;

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={onMinimize}
          className="bg-black/90 border-2 border-yellow-500 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform"
          style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
        >
          <img src={ROULETTE_LOGO} alt="Roulette" className="w-12 h-12 object-contain" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 flex items-center justify-center">
      <div className="bg-black/98 border-2 border-yellow-500 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-yellow-500/50 bg-black/50">
          <div className="flex items-center gap-3">
            <img src={ROULETTE_LOGO} alt="Roulette" className="w-10 h-10 object-contain" />
            <span className="text-yellow-400 font-mono font-bold text-lg">CAPSULE CORP. ROULETTE</span>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showChipDialog} onOpenChange={setShowChipDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 font-mono text-xs">
                  <Coins className="w-4 h-4 mr-1" /> Chips
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-cyan-400 text-white font-mono">
                <DialogHeader>
                  <DialogTitle className="text-white font-mono bloom-glow">Asset Exchange</DialogTitle>
                </DialogHeader>
                <ChipPurchaseDialog user={user} onTransactionComplete={loadUser} platinumBarShdPrice={platinumBarShdPrice} />
              </DialogContent>
            </Dialog>
            <button onClick={onMinimize} className="text-gray-400 hover:text-white transition-colors p-1">
              <Minus className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-8 p-2 bg-black/30 border-b border-yellow-500/30">
          <div className="text-center">
            <div className="text-xs text-gray-400 font-mono">SHD</div>
            <div className="text-lg font-bold text-green-400 font-mono">{user?.shard_balance?.toLocaleString() || '0'}</div>
          </div>
          <div className="text-center flex flex-col items-center">
            <img src={CHIPS_LOGO} alt="Chips" className="w-6 h-6 object-contain mb-1" />
            <div className="text-lg font-bold text-yellow-400 font-mono">{user?.chips?.toLocaleString() || '0'}</div>
          </div>
          <div className="text-center flex flex-col items-center">
            <img src={PLATINUM_LOGO} alt="Platinum" className="w-6 h-6 object-contain mb-1" />
            <div className="text-lg font-bold text-white font-mono">{user?.platinum_bars?.toLocaleString() || '0'}</div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-auto p-4">
          {user ? (
            <RouletteGame user={user} onBalanceChange={loadUser} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ROULETTE_LOGO };