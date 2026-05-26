import React, { useState, useEffect } from "react";
import { X, Minus, ShoppingCart } from "lucide-react";
import { MarketplaceItem } from "@/entities/MarketplaceItem";
import { ShardTransaction } from "@/entities/ShardTransaction";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";

const MARKETPLACE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/marketplace-icon.png";

export default function MarketplacePopup({ isOpen, isMinimized, onClose, onMinimize, user }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (isOpen && user) {
      loadItems();
    }
  }, [isOpen, user]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const allItems = await MarketplaceItem.filter({ status: "active" });
      setItems(allItems.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Error loading marketplace items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseItem = async (item) => {
    if (user.shard_balance < item.price) {
      alert(`Insufficient balance. You need ${item.price} SHD but have ${user.shard_balance} SHD.`);
      return;
    }

    if (!confirm(`Purchase "${item.title}" for ${item.price.toLocaleString()} SHD?`)) return;

    try {
      await ShardTransaction.create({
        from_user: user.email,
        to_user: item.seller_email,
        from_user_wallet: user.email,
        to_user_wallet: item.seller_email,
        amount: item.price,
        transaction_type: "marketplace_purchase",
        marketplace_item_id: item.id,
        status: "completed"
      });

      // Deduct from buyer's balance
      await User.updateMyUserData({ shard_balance: user.shard_balance - item.price });
      
      // Add to seller's balance
      const sellerUsers = await User.filter({ email: item.seller_email });
      if (sellerUsers.length > 0) {
        const seller = sellerUsers[0];
        await User.update(seller.id, { shard_balance: (seller.shard_balance || 0) + item.price });
      }

      await MarketplaceItem.update(item.id, { status: "sold" });
      alert("Purchase successful!");
      loadItems();
    } catch (error) {
      console.error("Error purchasing item:", error);
      alert("Purchase failed. Please try again.");
    }
  };

  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed top-[200px] right-4 z-50">
        <button
          onClick={onMinimize}
          className="bg-black/90 border-2 border-green-400 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform"
          style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)' }}
        >
          <ShoppingCart className="w-6 h-6 text-green-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-[200px] right-4 z-50 w-[500px] h-[600px]">
      <div className="bg-black/95 border-2 border-green-400 rounded-lg shadow-2xl h-full flex flex-col"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 0, 0.3)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-green-400/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-mono font-bold">MARKETPLACE</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onMinimize} className="text-gray-400 hover:text-white transition-colors p-1">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-3 border-b border-green-400/30 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", "software", "designs", "documents", "media", "other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded font-mono text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-green-600 text-white"
                    : "bg-black/30 text-gray-300 hover:bg-green-600/20"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="text-center text-gray-400 font-mono text-xs py-4">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-gray-400 font-mono text-xs py-4">No items available</div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-black/40 border border-green-400/30 rounded p-2">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-mono text-xs font-bold truncate">{item.title}</h3>
                    <p className="text-gray-400 font-mono text-xs truncate">{item.description}</p>
                  </div>
                  <div className="text-green-400 font-mono text-xs font-bold whitespace-nowrap">
                    {item.price.toLocaleString()} SHD
                  </div>
                </div>
                <div className="flex gap-2 items-center justify-between text-xs">
                  <span className="text-gray-500 font-mono">{item.seller_email}</span>
                  <Button
                    onClick={() => purchaseItem(item)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-6 text-xs"
                  >
                    Buy
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { MARKETPLACE_LOGO };