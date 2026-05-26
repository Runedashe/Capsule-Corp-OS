import React, { useState, useEffect, useRef } from "react";
import { X, Minus, Send, Loader2, Trash2 } from "lucide-react";
import { User } from "@/entities/User";
import { Message } from "@/entities/Message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MESSENGER_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/fd628d5e0_OrbitMessengerlogo.png";

export default function MessengerPopup({ isOpen, isMinimized, onClose, onMinimize, user }) {
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      const usersList = await User.list();
      const allMessages = await Message.list("-created_date", 100);
      setAllUsers(usersList.filter(u => u.email !== user.email));
      setMessages(allMessages);
    } catch (error) {
      console.error("Error loading messenger data:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || isProcessing || !selectedUser) return;

    const messageContent = currentInput.trim();
    setCurrentInput("");
    setIsProcessing(true);

    try {
      await Message.create({
        from_user: user.email,
        to_user: selectedUser.email,
        content: messageContent,
        message_type: "user"
      });

      await loadData();
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = async () => {
    if (!confirm("Clear this conversation? This cannot be undone.")) return;
    try {
      const conversation = getConversation();
      for (const msg of conversation) {
        await Message.delete(msg.id);
      }
      await loadData();
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const getConversation = () => {
    if (!user || !messages || !selectedUser) return [];
    
    return messages
      .filter(m => (m.from_user === user.email && m.to_user === selectedUser.email) || (m.from_user === selectedUser.email && m.to_user === user.email))
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onMinimize}
          className="bg-black/90 border-2 border-cyan-400 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform"
          style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}
        >
          <img src={MESSENGER_LOGO} alt="Messenger" className="w-12 h-12 object-contain" />
        </button>
      </div>
    );
  }

  const conversation = getConversation();

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] h-[500px]">
      <div className="bg-black/95 border-2 border-cyan-400 rounded-lg shadow-2xl h-full flex flex-col"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-cyan-400/50">
          <div className="flex items-center gap-2">
            <img src={MESSENGER_LOGO} alt="Messenger" className="w-8 h-8 object-contain" />
            <span className="text-cyan-400 font-mono font-bold">ORBIT MESSENGER</span>
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

        {/* Users Section */}
        {!selectedUser ? (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full text-left p-2 bg-black/30 hover:bg-cyan-600/20 rounded font-mono text-xs text-white transition-colors"
                >
                  {u.username || u.email}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="p-2 border-b border-cyan-400/30 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedUser(null)} className="text-cyan-400 text-xs">← Back</button>
                <span className="text-white font-mono text-xs">{selectedUser.username || selectedUser.email}</span>
              </div>
              <button onClick={clearChat} className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 text-xs font-mono">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2" ref={scrollAreaRef}>
              <div className="space-y-2">
                {conversation.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from_user === user.email ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg font-mono text-xs break-words ${
                      msg.from_user === user.email ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2 border-t border-cyan-400/30 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="bg-black/50 border-gray-600 text-white font-mono text-xs"
                  placeholder="Type a message..."
                  disabled={isProcessing}
                />
                <Button onClick={sendMessage} disabled={isProcessing} size="sm" className="bg-cyan-600">
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </>
        )}
        </div>
        </div>
        );
        }

export { MESSENGER_LOGO };