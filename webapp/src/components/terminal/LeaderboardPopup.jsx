import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeaderboardPopup({ isOpen, onClose, user }) {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadLeaderboard();
  }, [isOpen]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const users = await base44.entities.User.list("-shard_balance", 10);
      setLeaders(users);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-black/95 border-2 border-yellow-400 rounded-lg shadow-2xl w-[420px] max-h-[500px] flex flex-col"
        style={{ boxShadow: '0 0 30px rgba(255, 200, 0, 0.4)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-yellow-400/50">
          <span className="text-yellow-400 font-mono font-bold text-lg">🏆 SHD LEADERBOARD</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-yellow-400 font-mono text-center py-8">Loading rankings...</p>
          ) : leaders.length === 0 ? (
            <p className="text-gray-400 font-mono text-center py-8">No data yet.</p>
          ) : (
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="text-yellow-400 border-b border-yellow-400/30">
                  <th className="text-left pb-2 w-10">#</th>
                  <th className="text-left pb-2">User</th>
                  <th className="text-right pb-2">SHD Balance</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-gray-800 ${u.email === user?.email ? 'text-cyan-400' : 'text-gray-300'}`}
                  >
                    <td className="py-2 text-yellow-400 font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td className="py-2">{u.username || u.email?.split('@')[0]}</td>
                    <td className="py-2 text-right text-green-400 font-bold">
                      {(u.shard_balance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}