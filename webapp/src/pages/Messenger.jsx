
import React, { useState, useEffect, useRef } from "react";
import { isEqual } from "lodash";
import { User } from "@/entities/User";
import { Message } from "@/entities/Message";
import { InvokeLLM, UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, Users, Send, Loader2, User as UserIcon, Paperclip, X, Trash2, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// Updated ChatWindow with BBM-style bubbles and profile pictures
const ChatWindow = ({
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
  isAIChat,
}) => {
  const fileInputRef = useRef(null);

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    // Clear the input value so selecting the same file again will trigger onChange
    e.target.value = '';
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
              const senderName = msg.from_user === "AI" ? "AI Assistant" :
                                isMyMessage ? "You" :
                                (senderUser?.username || msg.from_user);

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMyMessage ? "justify-end" : "justify-start"}`}>
                  {!isMyMessage && (
                    <div className="flex-shrink-0">
                      {msg.from_user === "AI" ? (
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center neon-border">
                          <Bot className="w-4 h-4 text-white bloom-glow" />
                        </div>
                      ) : senderUser?.profile_picture ? (
                        <img
                          src={senderUser.profile_picture}
                          alt={senderName}
                          className="w-8 h-8 rounded-full border border-cyan-400 neon-border"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center neon-border">
                          <UserIcon className="w-4 h-4 text-white bloom-glow" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isMyMessage ? "order-2" : "order-1"}`}>
                    {/* Sender name for group context */}
                    {!isMyMessage && (
                      <div className="text-xs text-cyan-400 font-mono mb-1 px-1 bloom-glow">
                        {senderName}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className={`relative px-4 py-2 rounded-2xl font-mono text-sm shadow-lg neon-border ${
                      isMyMessage
                        ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-br-md"
                        : msg.from_user === "AI"
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-bl-md"
                        : "bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-bl-md"
                    }`}>
                      {msg.attachment_url && (
                        <div className="mb-2">
                          <img src={msg.attachment_url} alt="Attached content" className="max-w-full h-auto rounded-md object-contain" />
                        </div>
                      )}
                      {msg.content && (
                        <div className="whitespace-pre-wrap break-words bloom-glow">
                          {msg.content}
                        </div>
                      )}

                      {/* Message tail */}
                      <div className={`absolute bottom-0 ${
                        isMyMessage
                          ? "right-0 transform translate-x-1"
                          : "left-0 transform -translate-x-1"
                      }`}>
                        <div className={`w-3 h-3 transform rotate-45 ${
                          isMyMessage
                            ? "bg-cyan-500"
                            : msg.from_user === "AI"
                            ? "bg-purple-500"
                            : "bg-gray-600"
                        }`}></div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs text-gray-400 font-mono mt-1 px-1 bloom-glow ${
                      isMyMessage ? "text-right" : "text-left"
                    }`}>
                      {new Date(msg.created_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {isMyMessage && (
                    <div className="flex-shrink-0 order-1">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt="You"
                          className="w-8 h-8 rounded-full border border-cyan-400 neon-border"
                        />
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

        <div className="flex flex-col gap-2 bg-black/30 rounded-lg p-2 neon-border">
          {attachmentPreview && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-cyan-400">
              <img src={attachmentPreview} alt="Attachment preview" className="w-full h-full object-cover" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600/80 text-white"
                onClick={onClearAttachment}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Input
              value={currentInput}
              onChange={onInputChange}
              onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
              className="bg-transparent border-none text-white font-mono placeholder-gray-400 focus:ring-0 bloom-glow flex-1"
              placeholder={placeholder}
              disabled={isProcessing}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="bg-gray-600 hover:bg-gray-700 font-mono px-3 bloom-glow flex-shrink-0"
              disabled={isProcessing || isAIChat}
            >
              <Paperclip className="w-4 h-4 bloom-glow" />
            </Button>
            <Button
              onClick={onSendMessage}
              disabled={isProcessing || (!currentInput.trim() && !attachmentPreview)}
              className="bg-cyan-600 hover:bg-cyan-700 font-mono px-4 bloom-glow flex-shrink-0"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin bloom-glow" /> : <Send className="w-4 h-4 bloom-glow" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Messenger() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollAreaRef = useRef(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [authError, setAuthError] = useState(null);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        }
      }, 100);
    }
  };

  const handleScroll = (e) => {
    if (!e.target) return;
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const loadData = async (forceUpdate = false, retryAttempt = 0) => {
    try {
      if (!user && retryAttempt === 0) {
        setIsLoading(true);
      }

      console.log(`Messenger: Loading user data (attempt ${retryAttempt + 1})`);
      
      // Add a small delay for retry attempts to allow backend to stabilize
      if (retryAttempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempt));
      }

      const currentUser = await User.me();
      console.log("Messenger: User fetched:", currentUser?.email, "Username:", currentUser?.username);
      
      // Check if user has a username set - this is now required for Messenger access
      if (!currentUser.username || currentUser.username.trim() === "") {
        console.log("Messenger: User has no username, showing setup prompt");
        setUser(currentUser);
        setIsLoading(false);
        setAuthError(null); // Clear any previous auth errors if user is successfully fetched but needs username
        return; // Don't proceed with loading other data if no username
      }

      const usersList = await User.list();
      const allMessages = await Message.list("-created_date", 500);

      // Prevent re-renders by only setting state if data has actually changed
      if (forceUpdate || !isEqual(currentUser, user)) {
        setUser(currentUser);
      }

      const filteredUsers = usersList.filter(u => u.email !== currentUser.email);
      if (forceUpdate || !isEqual(filteredUsers, allUsers)) {
        setAllUsers(filteredUsers);
      }

      if (forceUpdate || !isEqual(allMessages, messages)) {
        setMessages(allMessages);
      }

      // Clear any auth errors on successful load
      setAuthError(null);
      setAuthRetryCount(0);

    } catch (error) {
      console.error("Messenger: Error loading data:", error);
      
      // Implement retry logic for new users who might have timing issues
      if (retryAttempt < 3 && (error.message.includes('Unauthorized') || error.message.includes('Authentication') || error.message.includes('Forbidden'))) {
        console.log(`Messenger: Retrying authentication (attempt ${retryAttempt + 1} of 3)`);
        setAuthRetryCount(retryAttempt + 1);
        setAuthError(`Authentication retry ${retryAttempt + 1}/3...`);
        
        // Retry after a progressive delay
        setTimeout(() => {
          loadData(forceUpdate, retryAttempt + 1);
        }, 2000 * (retryAttempt + 1)); // Progressive delay: 2s, 4s, 6s
        
        return; // Stop current function execution to allow retry
      }
      
      // If all retries failed or it's a different error, set final error state
      if (retryAttempt >= 3) {
        console.error("Messenger: All authentication retries failed");
        setAuthError("Authentication failed after multiple attempts. Please try logging out and back in.");
      } else {
        // For other types of errors (not auth-related), just display the error
        setAuthError(error.message);
      }
    } finally {
      // Only set isLoading to false if it's the initial attempt or all retries have finished
      if (isLoading && (retryAttempt === 0 || retryAttempt >= 3 || authError && !authError.startsWith("Authentication retry"))) {
        setIsLoading(false);
      }
    }
  };

  const clearChatHistory = async () => {
    if (!user) return;
    
    const confirmMessage = activeTab === 'ai' 
      ? "Are you sure you want to clear all chat history with AI Assistant? This action cannot be undone."
      : `Are you sure you want to clear all chat history with ${selectedUser?.username || selectedUser?.email}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;
    
    setIsClearingChat(true);
    try {
      const targetEmail = activeTab === 'ai' ? "AI" : selectedUser.email;
      
      // Get all messages in this conversation
      const conversationMessages = messages.filter(msg => {
        if (activeTab === 'ai') {
          return (msg.from_user === user.email && msg.to_user === "AI") ||
                 (msg.from_user === "AI" && msg.to_user === user.email);
        } else {
          return (msg.from_user === user.email && msg.to_user === targetEmail) ||
                 (msg.from_user === targetEmail && msg.to_user === user.email);
        }
      });
      
      // Delete each message
      for (const msg of conversationMessages) {
        await Message.delete(msg.id);
      }
      
      // Refresh data to update UI
      await loadData(true);
      
      alert("Chat history cleared successfully!");
    } catch (error) {
      console.error("Error clearing chat history:", error);
      alert("Failed to clear chat history. Please try again.");
    } finally {
      setIsClearingChat(false);
    }
  };

  useEffect(() => {
    loadData(true); // Force update on initial load
    const interval = setInterval(() => loadData(false), 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, selectedUser]); // Scroll when messages or conversation changes, or selected user changes

  const handleFileSelect = (file) => {
    if (file) {
      setAttachmentFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAttachmentPreview(previewUrl);
    }
  };

  const clearAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview); // Clean up the object URL
    }
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const sendMessage = async () => {
    // Message requires either content or an attachment
    if ((!currentInput.trim() && !attachmentFile) || isProcessing) return;

    const messageContent = currentInput.trim();
    const fileToSend = attachmentFile;

    setCurrentInput("");
    clearAttachment(); // Clear attachment after it's been stored in fileToSend

    setIsProcessing(true);
    setShouldAutoScroll(true);

    try {
      let fileUrl = null;
      if (fileToSend) {
        // Assume UploadFile returns { file_url: string }
        const { file_url } = await UploadFile({ file: fileToSend });
        fileUrl = file_url;
      }

      const toUser = activeTab === 'ai' ? "AI" : selectedUser.email;

      await Message.create({
        from_user: user.email,
        to_user: toUser,
        content: messageContent,
        attachment_url: fileUrl, // Pass attachment URL
        message_type: "user"
      });

      if (activeTab === 'ai' && !fileUrl) { // AI responds only to text messages, not file attachments
        const aiResponse = await InvokeLLM({
          prompt: `You are Bing AI integrated into the Orbit Messenger system. You help with troubleshooting, programming questions, and general assistance. User message: ${messageContent}`,
          add_context_from_internet: true
        });

        await Message.create({
          from_user: "AI",
          to_user: user.email,
          content: aiResponse,
          message_type: "ai"
        });
      }

      await loadData(true); // Force a data refresh and re-render after sending
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getConversationWith = (targetUser) => {
    if (!user || !messages) return [];

    if (targetUser === "AI") {
      return messages
        .filter(m =>
          (m.from_user === user.email && m.to_user === "AI") ||
          (m.from_user === "AI" && m.to_user === user.email)
        )
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else {
      return messages
        .filter(m =>
          (m.from_user === user.email && m.to_user === targetUser.email) ||
          (m.from_user === targetUser.email && m.to_user === user.email)
        )
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }
  };

  const getUnreadCount = (userEmail) => {
    if (!messages || !user) return 0;
    return messages.filter(msg =>
      msg.from_user === userEmail &&
      msg.to_user === user.email &&
      !msg.is_read
    ).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin bloom-glow" />
          <div className="text-white font-mono bloom-glow">Loading messenger...</div>
          {authRetryCount > 0 && (
            <div className="text-cyan-400 font-mono text-sm">
              {authError || `Authenticating... (${authRetryCount}/3)`}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show authentication error with retry option
  if (authError && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="bg-black/70 border-red-400 neon-border p-8 max-w-md mx-auto text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-400 bloom-glow" />
            </div>
            <CardTitle className="text-white font-mono bloom-glow text-xl mb-4">
              AUTHENTICATION ERROR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-400 font-mono bloom-glow text-sm">
              {authError}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setAuthError(null);
                  setAuthRetryCount(0);
                  setIsLoading(true);
                  loadData(true); // Restart load process
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 font-mono"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Retry Authentication
              </Button>
              <Button 
                onClick={() => User.logout()}
                variant="outline"
                className="w-full border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-black font-mono"
              >
                Logout & Login Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has username - if not, show setup prompt
  // This check now happens after initial authentication and retries
  if (user && (!user.username || user.username.trim() === "")) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="bg-black/70 border-cyan-400 neon-border p-8 max-w-md mx-auto text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-yellow-400 bloom-glow" />
            </div>
            <CardTitle className="text-white font-mono bloom-glow text-xl mb-4">
              USERNAME REQUIRED
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-cyan-400 font-mono bloom-glow">
              To access Orbit Messenger, you need to set up a username first.
            </p>
            <p className="text-gray-400 font-mono text-sm">
              Your username will be used as your messenger identity along with your secure email authentication.
            </p>
            <Link to={createPageUrl("Profile")}>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 font-mono bloom-glow">
                <UserIcon className="w-4 h-4 mr-2" />
                Set Up Username in Profile
              </Button>
            </Link>
            <p className="text-xs text-gray-500 font-mono">
              After setting your username, return here to start messaging.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we reach here, it means user is authenticated and has a username
  return (
    <div className="p-6 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white bloom-glow font-mono mb-2">
          ORBIT MESSENGER
        </h1>
        <p className="text-cyan-400 font-mono bloom-glow">
          AI Troubleshooting & User Communication
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-black/50 border-cyan-400 mb-4">
          <TabsTrigger value="users" className="font-mono data-[state=active]:bg-cyan-600">
            <Users className="w-4 h-4 mr-2" />
            Users ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="ai" className="font-mono data-[state=active]:bg-cyan-600">
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="flex-1 flex gap-6">
          <Card className="w-1/3 bg-black/50 border-cyan-400 neon-border">
            <CardHeader>
              <CardTitle className="text-white font-mono bloom-glow">Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {allUsers.map((u) => {
                    const unreadCount = getUnreadCount(u.email);
                    return (
                      <Button
                        key={u.id}
                        variant={selectedUser?.id === u.id ? "default" : "outline"}
                        className="w-full justify-start font-mono text-left p-3 h-auto"
                        onClick={() => {
                          setSelectedUser(u);
                          setShouldAutoScroll(true);
                          clearAttachment();
                        }}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {u.profile_picture ? (
                            <img
                              src={u.profile_picture}
                              alt={u.username || u.email}
                              className="w-10 h-10 rounded-full border border-cyan-400"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <div className="font-medium truncate">
                              {u.username || u.email}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {u.email}
                            </div>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs ml-2 flex-shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                  {allUsers.length === 0 && (
                    <div className="text-center text-gray-400 font-mono py-8">
                      No other users found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {selectedUser ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedUser.profile_picture ? (
                    <img
                      src={selectedUser.profile_picture}
                      alt={selectedUser.username || selectedUser.email}
                      className="w-8 h-8 rounded-full border border-cyan-400"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-white font-mono bloom-glow">Chat with {selectedUser.username || selectedUser.email}</span>
                </div>
                <Button
                  onClick={clearChatHistory}
                  disabled={isClearingChat}
                  variant="outline"
                  size="sm"
                  className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white font-mono"
                >
                  {isClearingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isClearingChat ? "Clearing..." : "Clear Chat"}
                </Button>
              </div>
              <ChatWindow
                conversation={getConversationWith(selectedUser)}
                title=""
                placeholder="Type a message or attach a file..."
                currentInput={currentInput}
                onInputChange={(e) => setCurrentInput(e.target.value)}
                onSendMessage={sendMessage}
                isProcessing={isProcessing}
                scrollAreaRef={scrollAreaRef}
                onScroll={handleScroll}
                user={user}
                allUsers={allUsers}
                attachmentPreview={attachmentPreview}
                onFileSelect={handleFileSelect}
                onClearAttachment={clearAttachment}
                isAIChat={false}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-mono">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a user to start chatting</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-mono bloom-glow">Chat with AI (Bing Integration)</span>
            </div>
            <Button
              onClick={clearChatHistory}
              disabled={isClearingChat}
              variant="outline"
              size="sm"
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white font-mono"
            >
              {isClearingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isClearingChat ? "Clearing..." : "Clear Chat"}
            </Button>
          </div>
          <ChatWindow
            conversation={getConversationWith("AI")}
            title=""
            placeholder="Ask AI for help..."
            currentInput={currentInput}
            onInputChange={(e) => setCurrentInput(e.target.value)}
            onSendMessage={sendMessage}
            isProcessing={isProcessing}
            scrollAreaRef={scrollAreaRef}
            onScroll={handleScroll}
            user={user}
            allUsers={allUsers}
            attachmentPreview={attachmentPreview}
            onFileSelect={handleFileSelect}
            onClearAttachment={clearAttachment}
            isAIChat={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
