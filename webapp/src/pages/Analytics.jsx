import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const received = await base44.entities.ShardTransaction.filter({ to_user: currentUser.email }, "-created_date", 50);
      const sent = await base44.entities.ShardTransaction.filter({ from_user: currentUser.email }, "-created_date", 50);
      const all = [...received, ...sent].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Deduplicate by id
      const seen = new Set();
      setTransactions(all.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      }));
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const totalIn = transactions.filter(t => t.to_user === user?.email).reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOut = transactions.filter(t => t.from_user === user?.email).reduce((sum, t) => sum + (t.amount || 0), 0);

  const byType = transactions.reduce((acc, t) => {
    const type = t.transaction_type || 'other';
    acc[type] = (acc[type] || 0) + t.amount;
    return acc;
  }, {});
  const chartData = Object.entries(byType).map(([type, amount]) => ({ type, amount }));

  return (
    <div className="min-h-screen font-mono p-6" style={{ background: '#312e81' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href={createPageUrl('Terminal')}
            className="text-cyan-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Terminal</span>
          </a>
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px #00FFFF' }}>
            📊 SHD ANALYTICS
          </h1>
        </div>

        {isLoading ? (
          <p className="text-cyan-400 text-center py-20">Loading analytics...</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-black/50 border border-cyan-400/40 rounded-lg p-5 text-center">
                <Wallet className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs mb-1">Current Balance</p>
                <p className="text-cyan-400 text-2xl font-bold">{(user?.shard_balance || 0).toLocaleString()}</p>
                <p className="text-gray-500 text-xs">SHD</p>
              </div>
              <div className="bg-black/50 border border-green-400/40 rounded-lg p-5 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs mb-1">Total Received</p>
                <p className="text-green-400 text-2xl font-bold">+{totalIn.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">SHD</p>
              </div>
              <div className="bg-black/50 border border-red-400/40 rounded-lg p-5 text-center">
                <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs mb-1">Total Sent</p>
                <p className="text-red-400 text-2xl font-bold">-{totalOut.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">SHD</p>
              </div>
            </div>

            {/* Bar Chart */}
            {chartData.length > 0 && (
              <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-5 mb-8">
                <h2 className="text-cyan-400 font-bold mb-4">Volume by Transaction Type</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="type" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ background: '#000', border: '1px solid #00FFFF', fontFamily: 'monospace', fontSize: 11 }}
                      formatter={(v) => [v.toLocaleString() + ' SHD', 'Amount']}
                    />
                    <Bar dataKey="amount" fill="#00FFFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Transaction Table */}
            <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-5">
              <h2 className="text-cyan-400 font-bold mb-4">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left pb-2">Type</th>
                        <th className="text-left pb-2">From</th>
                        <th className="text-left pb-2">To</th>
                        <th className="text-right pb-2">Amount</th>
                        <th className="text-right pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-b border-gray-800">
                          <td className="py-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              tx.transaction_type === 'allocation' ? 'text-green-400' :
                              tx.transaction_type === 'transfer' ? 'text-cyan-400' :
                              tx.transaction_type === 'marketplace_purchase' ? 'text-purple-400' :
                              'text-yellow-400'
                            }`}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="py-2 text-gray-300">{tx.from_user?.split('@')[0] || 'System'}</td>
                          <td className="py-2 text-gray-300">{tx.to_user?.split('@')[0] || '?'}</td>
                          <td className={`py-2 text-right font-bold ${tx.to_user === user?.email ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.to_user === user?.email ? '+' : '-'}{(tx.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-gray-500">
                            {new Date(tx.created_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}