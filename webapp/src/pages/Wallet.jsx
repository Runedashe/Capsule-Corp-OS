import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { ShardTransaction } from "@/entities/ShardTransaction";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { transferInApp } from "@/functions/transferInApp";
import { Send, TrendingUp, Banknote, Loader2, Info, ShoppingCart } from "lucide-react";

const MASTERCARD_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/31571302c_mastercard-removebg-preview.png";

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [marketData, setMarketData] = useState({ price: 0, volume: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [transferAmount, setTransferAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    loadData();
    fetchMarketData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const userTransactions = await ShardTransaction.filter(
          { $or: [{ from_user: currentUser.email }, { to_user: currentUser.email }] },
          "-created_date",
          50
      );
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const result = await InvokeLLM({
        prompt: `Get the current price in USD and 24-hour trading volume for Shard (SHD) from KuCoin or Bitget.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            price: { type: "number" },
            volume: { type: "number" }
          }
        }
      });
      setMarketData({ price: result.price || 0.0001, volume: result.volume || 0 });
    } catch (error) {
      console.error("Error fetching market data:", error);
      setMarketData({ price: 0.0001, volume: 0 }); // Default fallback
    }
  };
  
  const getBalanceColor = (balance) => {
    if (!balance || balance < 1000) return "shard-red";
    if (balance < 100000) return "shard-yellow";
    if (balance < 1000000) return "shard-white";
    if (balance < 10000000) return "shard-green";
    if (balance < 100000000) return "shard-cyan";
    return "shard-yellow";
  };

  const handleTransfer = async () => {
    if (!transferAmount || !recipientEmail) {
      alert("Please fill in both recipient and amount.");
      return;
    }

    setIsTransferring(true);
    try {
      const { data, error } = await transferInApp({
        recipientEmail: recipientEmail,
        amount: parseFloat(transferAmount)
      });
      
      if (error) {
          throw new Error(error.message || "Transfer failed");
      }

      alert(data.message);
      setTransferAmount("");
      setRecipientEmail("");
      loadData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white bloom-glow font-mono mb-2">SHD WALLET</h1>
        <p className="text-cyan-400 font-mono bloom-glow">Your personal in-app currency wallet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="bg-black/50 border-cyan-400 neon-border">
            <CardHeader>
                <CardTitle className="text-white font-mono bloom-glow">TOTAL SHD BALANCE</CardTitle>
                <CardDescription className="text-gray-400 font-mono">Total value of your in-app Shards.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className={`text-5xl font-bold font-mono bloom-glow ${getBalanceColor(user.shard_balance)}`}>
                    {user.shard_balance?.toLocaleString() || '0'}
                </div>
                <div className="text-lg text-gray-300 font-mono bloom-glow mt-2">
                    ≈ ${(user.shard_balance * marketData.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
            </CardContent>
        </Card>
        
        <Card className="bg-black/50 border-cyan-400 neon-border">
            <CardHeader>
                <CardTitle className="text-white font-mono bloom-glow">SHD MARKET DATA</CardTitle>
                <CardDescription className="text-gray-400 font-mono">Live data from exchanges.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-mono text-gray-300">Price (USD)</span>
                    <span className="text-2xl font-bold font-mono text-green-400 bloom-glow">${marketData.price.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-mono text-gray-300">24h Volume</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400 bloom-glow">{marketData.volume.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transfer" className="mb-8">
        <TabsList className="bg-black/50 border-cyan-400 grid w-full grid-cols-2">
          <TabsTrigger value="transfer" className="font-mono data-[state=active]:bg-cyan-600"><Send className="w-4 h-4 mr-2"/>Transfer</TabsTrigger>
          <TabsTrigger value="history" className="font-mono data-[state=active]:bg-cyan-600"><TrendingUp className="w-4 h-4 mr-2"/>History</TabsTrigger>
        </TabsList>
        <TabsContent value="transfer">
          <Card className="bg-black/50 border-cyan-400 neon-border">
            <CardHeader><CardTitle className="text-white font-mono bloom-glow">Instant SHD Transfer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 font-mono">Send SHD to another user on the platform instantly.</p>
              <div><label className="text-sm text-cyan-400 font-mono bloom-glow">Recipient Email</label><Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="bg-black/50 border-gray-600 text-white font-mono" placeholder="user@example.com" /></div>
              <div><label className="text-sm text-cyan-400 font-mono bloom-glow">Amount (SHD)</label><Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="bg-black/50 border-gray-600 text-white font-mono" placeholder="0.00" /></div>
              <Button onClick={handleTransfer} disabled={isTransferring} className="w-full bg-green-600 hover:bg-green-700 font-mono">
                {isTransferring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Transferring...</> : 'Send SHD'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="bg-black/50 border-cyan-400 neon-border">
            <CardHeader><CardTitle className="text-white font-mono bloom-glow">Recent Transactions</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700">
                            <div>
                                <div className="text-white font-mono font-medium">
                                    {tx.from_user === user.email ? "Sent to" : "Received from"}{" "}
                                    {tx.from_user === user.email ? tx.to_user : tx.from_user}
                                </div>
                                <div className="text-sm text-gray-400 font-mono">{new Date(tx.created_date).toLocaleString()}</div>
                            </div>
                            <div className={`font-mono font-bold ${tx.from_user === user.email ? "text-red-400" : "text-green-400"}`}>
                                {tx.from_user === user.email ? "-" : "+"}
                                {tx.amount.toLocaleString()} SHD
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="text-center text-gray-400 font-mono py-8">No transactions yet</div>
                    )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}