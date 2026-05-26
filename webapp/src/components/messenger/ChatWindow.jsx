import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Bot, Loader2, Send, Paperclip, X } from "lucide-react";

export default function ChatWindow({ 
  conversation, 
  title, 
  placeholder,
  currentInput,
  onInputChange,
  onSendMessage,
  isProcessing,
  scrollAreaRef,
  onScroll,
  user,
  allUsers,
  attachmentPreview,
  onFileSelect,
  onClearAttachment,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    // Reset file input to allow selecting the same file again
    e.target.value = null;
  };

  return (
    <Card className="flex-1 bg-black/50 border-cyan-400 neon-border flex flex-col h-[600px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-white font-mono bloom-glow">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea 
          className="flex-1 mb-4" 
          ref={scrollAreaRef}
          onScrollCapture={onScroll}
        >
          <div className="space-y-3 p-2">
            {conversation.map((msg) => {
              const isMyMessage = msg.from_user === user?.email;
              const senderUser = msg.from_user === "AI" ? null : allUsers.find(u => u.email === msg.from_user);
              const senderName = msg.from_user === "AI" ? "AI Assistant" : isMyMessage ? "You" : (senderUser?.username || msg.from_user);
              
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMyMessage ? "justify-end" : "justify-start"}`}>
                  {!isMyMessage && (
                    <div className="flex-shrink-0">
                      {msg.from_user === "AI" ? (
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center neon-border">
                          <Bot className="w-4 h-4 text-white bloom-glow" />
                        </div>
                      ) : senderUser?.profile_picture ? (
                        <img src={senderUser.profile_picture} alt={senderName} className="w-8 h-8 rounded-full border border-cyan-400 neon-border" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center neon-border">
                          <UserIcon className="w-4 h-4 text-white bloom-glow" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[75%]`}>
                    {!isMyMessage && (
                      <div className="text-xs text-cyan-400 font-mono mb-1 px-1 bloom-glow">{senderName}</div>
                    )}
                    
                    <div className={`relative px-4 py-2 rounded-2xl font-mono text-sm shadow-lg neon-border ${
                      isMyMessage 
                        ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-br-md" 
                        : msg.from_user === "AI"
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-bl-md"
                        : "bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-bl-md"
                    }`}>
                      {msg.attachment_url && (
                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img src={msg.attachment_url} alt="Attachment" className="rounded-lg mb-2 max-h-48 cursor-pointer" />
                        </a>
                      )}
                      {msg.content && (
                        <div className="whitespace-pre-wrap break-words bloom-glow">{msg.content}</div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-400 font-mono mt-1 px-1 bloom-glow ${isMyMessage ? "text-right" : "text-left"}`}>
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isMyMessage && (
                    <div className="flex-shrink-0">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt="You" className="w-8 h-8 rounded-full border border-cyan-400 neon-border" />
                      ) : (
                        <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center neon-border">
                          <UserIcon className="w-4 h-4 text-white bloom-glow" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {attachmentPreview && (
          <div className="relative w-24 h-24 mb-2 p-1 border border-cyan-400 rounded-md neon-border">
            <img src={attachmentPreview} alt="Preview" className="w-full h-full object-cover rounded" />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full"
              onClick={onClearAttachment}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 bg-black/30 rounded-lg p-2 neon-border">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="text-cyan-400 hover:text-cyan-200"
          >
            <Paperclip className="w-5 h-5 bloom-glow" />
          </Button>
          <Input
            value={currentInput}
            onChange={onInputChange}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            className="bg-transparent border-none text-white font-mono placeholder-gray-400 focus:ring-0 bloom-glow"
            placeholder={placeholder}
            disabled={isProcessing}
          />
          <Button 
            onClick={onSendMessage} 
            disabled={isProcessing || (!currentInput.trim() && !attachmentPreview)} 
            className="bg-cyan-600 hover:bg-cyan-700 font-mono px-4 bloom-glow"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin bloom-glow" /> : <Send className="w-4 h-4 bloom-glow" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}