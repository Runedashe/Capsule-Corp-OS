import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from '@/entities/User';
import { ShardTransaction } from '@/entities/ShardTransaction';
import { CHIP_SHD_RATE, PLATINUM_BAR_USD_VALUE } from '@/pages/Roulette';
import { ArrowRightLeft, Loader2 } from 'lucide-react';

export default function ChipPurchaseDialog({ user, onTransactionComplete, platinumBarShdPrice }) {
  const [shdToChips, setShdToChips] = useState('');
  const [chipsToShd, setChipsToShd] = useState('');
  const [platinumToBuy, setPlatinumToBuy] = useState('');
  const [platinumToSell, setPlatinumToSell] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransaction = async (action) => {
    setIsProcessing(true);
    try {
      let shdAmount, chipAmount, platinumAmount;
      const casinoOwnerEmail = "shabeenashfak@gmail.com";

      switch (action) {
        case 'buy_chips':
          shdAmount = Number(shdToChips);
          chipAmount = shdAmount; // 1:1 ratio
          if (shdAmount > user.shard_balance) throw new Error("Insufficient SHD balance");
          
          // Update user balances directly
          await User.updateMyUserData({
            shard_balance: (user.shard_balance || 0) - shdAmount,
            chips: (user.chips || 0) + chipAmount
          });

          // Log transaction
          await ShardTransaction.create({
            from_user: user.email,
            to_user: casinoOwnerEmail,
            from_user_wallet: "in-app",
            to_user_wallet: "in-app",
            amount: shdAmount,
            transaction_type: "marketplace_purchase",
            marketplace_item_id: "Gaming Chips Purchase"
          });
          break;
          
        case 'sell_chips':
          chipAmount = Number(chipsToShd);
          shdAmount = chipAmount; // 1:1 ratio
          if (chipAmount > (user.chips || 0)) throw new Error("Insufficient chip balance");
          
          await User.updateMyUserData({
            shard_balance: (user.shard_balance || 0) + shdAmount,
            chips: (user.chips || 0) - chipAmount
          });

          await ShardTransaction.create({
            from_user: casinoOwnerEmail,
            to_user: user.email,
            from_user_wallet: "in-app",
            to_user_wallet: "in-app",
            amount: shdAmount,
            transaction_type: "allocation",
            marketplace_item_id: "Chip Redemption"
          });
          break;
          
        case 'buy_platinum':
          platinumAmount = Number(platinumToBuy);
          shdAmount = platinumAmount * platinumBarShdPrice;
          if (shdAmount > user.shard_balance) throw new Error("Insufficient SHD balance");
          
          await User.updateMyUserData({
            shard_balance: (user.shard_balance || 0) - shdAmount,
            platinum_bars: (user.platinum_bars || 0) + platinumAmount
          });

          await ShardTransaction.create({
            from_user: user.email,
            to_user: casinoOwnerEmail,
            from_user_wallet: "in-app",
            to_user_wallet: "in-app",
            amount: shdAmount,
            transaction_type: "marketplace_purchase",
            marketplace_item_id: "Platinum Bar Purchase"
          });
          break;
          
        case 'sell_platinum':
          platinumAmount = Number(platinumToSell);
          shdAmount = platinumAmount * platinumBarShdPrice;
          if (platinumAmount > (user.platinum_bars || 0)) throw new Error("Insufficient platinum bar balance");

          await User.updateMyUserData({
            shard_balance: (user.shard_balance || 0) + shdAmount,
            platinum_bars: (user.platinum_bars || 0) - platinumAmount
          });

          await ShardTransaction.create({
            from_user: casinoOwnerEmail,
            to_user: user.email,
            from_user_wallet: "in-app",
            to_user_wallet: "in-app",
            amount: shdAmount,
            transaction_type: "allocation",
            marketplace_item_id: "Platinum Redemption"
          });
          break;
          
        default:
          throw new Error("Invalid action");
      }
      onTransactionComplete();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
      setShdToChips('');
      setChipsToShd('');
      setPlatinumToBuy('');
      setPlatinumToSell('');
    }
  };

  const getChipAmount = (shdValue) => {
    const num = Number(shdValue);
    return (!shdValue || isNaN(num) || num <= 0) ? '0' : num.toLocaleString();
  };

  const getShdAmount = (chipValue) => {
    const num = Number(chipValue);
    return (!chipValue || isNaN(num) || num <= 0) ? '0' : num.toLocaleString();
  };

  const getPlatinumCost = (barValue) => {
    const num = Number(barValue);
    return (!barValue || isNaN(num) || num <= 0) ? '0' : (num * platinumBarShdPrice).toLocaleString();
  };

  return (
    <Tabs defaultValue="buy_chips" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="buy_chips">Buy Assets</TabsTrigger>
        <TabsTrigger value="sell_chips">Sell Assets</TabsTrigger>
      </TabsList>
      <TabsContent value="buy_chips">
        <div className="space-y-4 p-4">
          <div>
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a88d4a09_Motorheads_Arena_Logo-removebg-preview.png"
                alt="Gaming Chips"
                className="w-10 h-10 object-contain"
              />
              Buy Chips with SHD
            </h4>
            <p className="text-xs text-gray-400 mb-2">Rate: 1 SHD = 1 Chip | Available: {user.shard_balance?.toLocaleString() || '0'} SHD</p>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="SHD Amount" 
                value={shdToChips} 
                onChange={e => setShdToChips(e.target.value)} 
                className="bg-black/50 border-gray-600" 
              />
              <ArrowRightLeft className="text-cyan-400" />
              <span>{getChipAmount(shdToChips)} Chips</span>
            </div>
            <Button 
              onClick={() => handleTransaction('buy_chips')} 
              disabled={isProcessing || !shdToChips || isNaN(Number(shdToChips)) || Number(shdToChips) <= 0} 
              className="w-full mt-2 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? <Loader2 className="animate-spin"/> : "Buy Chips"}
            </Button>
          </div>
          <hr className="border-cyan-900"/>
          <div>
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b221463ca_platinum-bar-removebg-preview.png"
                alt="Platinum Bar"
                className="w-10 h-10 object-contain"
              />
              Buy Platinum Bars with SHD
            </h4>
            <p className="text-xs text-gray-400 mb-2">Price: {platinumBarShdPrice.toLocaleString()} SHD per bar | Available: {user.shard_balance?.toLocaleString() || '0'} SHD</p>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="# of Bars" 
                value={platinumToBuy} 
                onChange={e => setPlatinumToBuy(e.target.value)} 
                className="bg-black/50 border-gray-600" 
              />
              <span>Cost: {getPlatinumCost(platinumToBuy)} SHD</span>
            </div>
            <Button 
              onClick={() => handleTransaction('buy_platinum')} 
              disabled={isProcessing || !platinumToBuy || platinumBarShdPrice <= 0 || isNaN(Number(platinumToBuy)) || Number(platinumToBuy) <= 0} 
              className="w-full mt-2 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? <Loader2 className="animate-spin"/> : "Buy Platinum"}
            </Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="sell_chips">
        <div className="space-y-4 p-4">
          <div>
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a88d4a09_Motorheads_Arena_Logo-removebg-preview.png"
                alt="Gaming Chips"
                className="w-10 h-10 object-contain"
              />
              Sell Chips for SHD
            </h4>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Chip Amount" 
                value={chipsToShd} 
                onChange={e => setChipsToShd(e.target.value)} 
                className="bg-black/50 border-gray-600" 
              />
              <ArrowRightLeft className="text-cyan-400" />
              <span>{getShdAmount(chipsToShd)} SHD</span>
            </div>
            <Button 
              onClick={() => handleTransaction('sell_chips')} 
              disabled={isProcessing || !chipsToShd || isNaN(Number(chipsToShd)) || Number(chipsToShd) <= 0} 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? <Loader2 className="animate-spin"/> : "Sell Chips"}
            </Button>
          </div>
          <hr className="border-cyan-900"/>
          <div>
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b221463ca_platinum-bar-removebg-preview.png"
                alt="Platinum Bar"
                className="w-10 h-10 object-contain"
              />
              Sell Platinum Bars for SHD
            </h4>
             <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="# of Bars" 
                value={platinumToSell} 
                onChange={e => setPlatinumToSell(e.target.value)} 
                className="bg-black/50 border-gray-600" 
              />
              <span>Receive: {getPlatinumCost(platinumToSell)} SHD</span>
            </div>
            <Button 
              onClick={() => handleTransaction('sell_platinum')} 
              disabled={isProcessing || !platinumToSell || platinumBarShdPrice <= 0 || isNaN(Number(platinumToSell)) || Number(platinumToSell) <= 0} 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? <Loader2 className="animate-spin"/> : "Sell Platinum"}
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}