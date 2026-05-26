import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RouletteGame from "@/components/roulette/RouletteGame";
import ChipPurchaseDialog from "@/components/roulette/ChipPurchaseDialog";
import { Dices, Diamond, Coins, Banknote, Loader2, RefreshCw } from "lucide-react";

export const CHIP_SHD_RATE = 1; // 1 Chip = 1 SHD
export const PLATINUM_BAR_USD_VALUE = 1000000; // 1 Platinum Bar = $1,000,000

export default function RoulettePage() {
  const [user, setUser] = useState(null);
  const [shardPrice, setShardPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showChipDialog, setShowChipDialog] = useState(false);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      await fetchShardPrice();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    loadData();
  }, []);
  
  const platinumBarShdPrice = shardPrice > 0 ? PLATINUM_BAR_USD_VALUE / shardPrice : 0;

  const handleTransactionComplete = () => {
    loadData();
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin bloom-glow" />
          <p className="text-white font-mono text-lg">Loading Roulette Chamber...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-mono text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white bloom-glow font-mono mb-2 flex items-center gap-3">
          <Dices className="w-8 h-8" />
          CYBERTRON ROULETTE
        </h1>
        <p className="text-cyan-400 font-mono bloom-glow">
          The high-stakes table where fortunes are made and lost.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black/50 border-cyan-400 neon-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400 bloom-glow flex items-center gap-2">
              SHD BALANCE
            </CardTitle>
            <Banknote className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bloom-glow text-green-400">{user.shard_balance?.toLocaleString() || '0'}</div>
            <p className="text-xs text-cyan-400 font-mono mt-1">Available for Gaming</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-cyan-400 neon-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400 bloom-glow">GAMING CHIPS</CardTitle>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a88d4a09_Motorheads_Arena_Logo-removebg-preview.png" 
              alt="Gaming Chips" 
              className="w-12 h-12 object-contain"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bloom-glow text-yellow-400">{user.chips?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-cyan-400 neon-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400 bloom-glow">PLATINUM BARS</CardTitle>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b221463ca_platinum-bar-removebg-preview.png" 
              alt="Platinum Bar" 
              className="w-12 h-12 object-contain"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bloom-glow text-white">{user.platinum_bars?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mb-6">
        <Dialog open={showChipDialog} onOpenChange={setShowChipDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 font-mono text-lg py-3 px-8">
              <Coins className="w-5 h-5 mr-2" />
              Manage Gaming Assets
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-cyan-400 text-white font-mono">
            <DialogHeader>
              <DialogTitle className="text-white font-mono bloom-glow">Asset Exchange</DialogTitle>
            </DialogHeader>
            <ChipPurchaseDialog user={user} onTransactionComplete={handleTransactionComplete} platinumBarShdPrice={platinumBarShdPrice} />
          </DialogContent>
        </Dialog>
      </div>

      <RouletteGame user={user} onBalanceChange={loadData} />
    </div>
  );
}