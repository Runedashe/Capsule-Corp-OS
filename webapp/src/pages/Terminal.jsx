import React, { useState, useEffect, useRef } from "react";
import { InvokeLLM, UploadFile } from "@/integrations/Core";
import { User } from "@/entities/User";
import { TerminalSession } from "@/entities/TerminalSession";
import { File } from "@/entities/File";
import { Message } from "@/entities/Message";
import { MarketplaceItem } from "@/entities/MarketplaceItem";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Upload } from "lucide-react";
import { createPageUrl } from "@/utils";
import PouchPopup, { POUCH_LOGO } from "@/components/terminal/PouchPopup";
import MessengerPopup, { MESSENGER_LOGO } from "@/components/terminal/MessengerPopup";
import RoulettePopup, { ROULETTE_LOGO } from "@/components/terminal/RoulettePopup";
import ProfilePopup, { PROFILE_LOGO } from "@/components/terminal/ProfilePopup";
import LeaderboardPopup from "@/components/terminal/LeaderboardPopup";
import MarketplacePopup from "@/components/terminal/MarketplacePopup";

const THEME_CONFIG = {
  cyberpunk: { bg: '#312e81', accent: '#00FFFF', borderColor: 'rgba(0,255,255,0.4)', shadow: '0 0 15px rgba(0,255,255,0.3)' },
  matrix:    { bg: '#000000', accent: '#00FF00', borderColor: 'rgba(0,255,0,0.4)',   shadow: '0 0 15px rgba(0,255,0,0.3)' },
  amber:     { bg: '#451a03', accent: '#FFAB00', borderColor: 'rgba(255,171,0,0.4)', shadow: '0 0 15px rgba(255,171,0,0.3)' },
  midnight:  { bg: '#1a0533', accent: '#8B5CF6', borderColor: 'rgba(139,92,246,0.4)', shadow: '0 0 15px rgba(139,92,246,0.3)' },
};

export default function Terminal() {
  const [output, setOutput] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState("");
  const [autoDebugEnabled, setAutoDebugEnabled] = useState(true);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex, ] = useState(-1);
  const [conversationContext, setConversationContext] = useState([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(null);
  const [sessionOrder, setSessionOrder] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  
  // Popup states
  const [showPouch, setShowPouch] = useState(false);
  const [showMessenger, setShowMessenger] = useState(false);
  const [messengerMinimized, setMessengerMinimized] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteMinimized, setRouletteMinimized] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const fileInputRef = useRef(null);
  const [aiPersonality, setAiPersonality] = useState('assistant');
  const [currentPath, setCurrentPath] = useState('/');
  const [theme, setTheme] = useState('cyberpunk');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [marketplaceMinimized, setMarketplaceMinimized] = useState(false);

  // Command hints mapping
  const commandHints = {
    "help": "Show available commands and usage",
    "clear": "Clear the terminal screen",
    "whoami": "Display current user information",
    "gem list": "List all installed Ruby gems",
    "shard balance": "Show your current SHD balance",
    "save": "Manually confirm session save (autosave is on by default)",
    "ls": "List files in the current directory",
    "cat": "Display file contents - cat filename.txt",
    "upload": "Upload a file to the file system",
    "download": "Download a file - download filename.txt",
    "rm": "Remove a file - rm filename.txt",
    "puts": "Ruby output command - puts 'Hello World'",
    "print": "Ruby print command - print 'text'",
    "p": "Ruby inspect command - p variable",
    "require": "Load Ruby library - require 'library'",
    "class": "Define Ruby class - class MyClass",
    "def": "Define Ruby method - def method_name",
    "if": "Ruby conditional - if condition",
    "while": "Ruby loop - while condition",
    "for": "Ruby for loop - for i in array",
    "begin": "Ruby exception handling - begin...rescue...end",
    "module": "Ruby module - module MyModule",
    "include": "Include Ruby module - include ModuleName",
    "attr_accessor": "Ruby attribute accessor - attr_accessor :name",
    "yield": "Ruby yield to block - yield value",
    "lambda": "Ruby lambda - lambda { |x| x * 2 }",
    "proc": "Ruby proc - proc { |x| x * 2 }",
    "case": "Ruby case statement - case variable",
    "when": "Ruby when clause - when condition",
    "unless": "Ruby unless statement - unless condition",
    "until": "Ruby until loop - until condition",
    "each": "Ruby each iterator - array.each { |item| }",
    "map": "Ruby map method - array.map { |item| }",
    "select": "Ruby select method - array.select { |item| }",
    "reject": "Ruby reject method - array.reject { |item| }",
    "find": "Ruby find method - array.find { |item| }",
    "reduce": "Ruby reduce method - array.reduce { |acc, item| }",
    "times": "Ruby times loop - 5.times { |i| }",
    "upto": "Ruby upto loop - 1.upto(5) { |i| }",
    "downto": "Ruby downto loop - 5.downto(1) { |i| }",
    "step": "Ruby step loop - 1.step(10, 2) { |i| }",
    "String": "Ruby String class - String.new",
    "Array": "Ruby Array class - Array.new",
    "Hash": "Ruby Hash class - Hash.new",
    "Integer": "Ruby Integer class - Integer('123')",
    "Float": "Ruby Float class - Float('12.34')",
    "File": "Ruby File class - File.open('file.txt')",
    "Dir": "Ruby Dir class - Dir.entries('.')",
    "Time": "Ruby Time class - Time.now",
    "Date": "Ruby Date class - Date.today",
    "Regexp": "Ruby Regexp class - Regexp.new('/pattern/')",
    "Marshal": "Ruby Marshal class - Marshal.dump(object)",
    "JSON": "Ruby JSON class - JSON.parse(string)",
    "CSV": "Ruby CSV class - CSV.read('file.csv')",
    "Net::HTTP": "Ruby HTTP class - Net::HTTP.get(uri)",
    "OpenSSL": "Ruby OpenSSL library - OpenSSL::Digest",
    "Base64": "Ruby Base64 encoding - Base64.encode64(string)",
    "URI": "Ruby URI class - URI.parse(url)",
    "Digest": "Ruby Digest class - Digest::SHA256.hexdigest",
    "SecureRandom": "Ruby SecureRandom - SecureRandom.hex",
    "Benchmark": "Ruby Benchmark - Benchmark.measure { code }",
    "Thread": "Ruby Thread class - Thread.new { code }",
    "Mutex": "Ruby Mutex class - Mutex.new",
    "Queue": "Ruby Queue class - Queue.new",
    "Set": "Ruby Set class - Set.new",
    "Matrix": "Ruby Matrix class - Matrix[[1,2],[3,4]]",
    "Complex": "Ruby Complex class - Complex(1, 2)",
    "Rational": "Ruby Rational class - Rational(1, 2)",
    "Fiber": "Ruby Fiber class - Fiber.new { code }",
    "Enumerator": "Ruby Enumerator class - Enumerator.new",
    "Struct": "Ruby Struct class - Struct.new(:name, :age)",
    "OpenStruct": "Ruby OpenStruct class - OpenStruct.new",
    "Pathname": "Ruby Pathname class - Pathname.new('/path')",
    "Tempfile": "Ruby Tempfile class - Tempfile.new",
    "StringIO": "Ruby StringIO class - StringIO.new",
    "Logger": "Ruby Logger class - Logger.new(STDOUT)",
    "OptionParser": "Ruby OptionParser - OptionParser.new",
    "YAML": "Ruby YAML class - YAML.load(string)",
    "Zlib": "Ruby Zlib compression - Zlib.deflate",
    "Socket": "Ruby Socket class - Socket.new",
    "IPAddr": "Ruby IPAddr class - IPAddr.new('192.168.1.1')",
    "Resolv": "Ruby Resolv DNS - Resolv.getaddress('google.com')",
    "Timeout": "Ruby Timeout - Timeout.timeout(5) { code }",
    "Monitor": "Ruby Monitor class - Monitor.new",
    "Singleton": "Ruby Singleton pattern - include Singleton",
    "Forwardable": "Ruby Forwardable - extend Forwardable",
    "Observable": "Ruby Observable - include Observable",
    "Delegate": "Ruby Delegate - extend Delegate",
    "WeakRef": "Ruby WeakRef - WeakRef.new(object)",
    "ObjectSpace": "Ruby ObjectSpace - ObjectSpace.each_object",
    "TracePoint": "Ruby TracePoint - TracePoint.new(:call)",
    "RubyVM": "Ruby VM statistics - RubyVM.stat",
    "GC": "Ruby Garbage Collector - GC.start",
    "Process": "Ruby Process class - Process.pid",
    "Signal": "Ruby Signal handling - Signal.trap('INT')",
    "ENV": "Ruby Environment variables - ENV['HOME']",
    "ARGV": "Ruby command line arguments - ARGV",
    "STDIN": "Ruby standard input - STDIN.gets",
    "STDOUT": "Ruby standard output - STDOUT.puts",
    "STDERR": "Ruby standard error - STDERR.puts",
    "$:": "Ruby load path - $: << '/path'",
    "$0": "Ruby script name - $0",
    "$$": "Ruby process ID - $$",
    "$?": "Ruby last exit status - $?",
    "cybertron": "Cybertron gem commands - cybertron.initialize",
    "shard": "Shard operations - shard.transfer(amount, to)",
    "wallet": "Wallet operations - wallet.balance",
    "blockchain": "Blockchain operations - blockchain.sync",
    "ethereum": "Ethereum operations - ethereum.connect",
    "ruby_terminal": "Ruby Terminal operations - ruby_terminal.version"
  };

  useEffect(() => {
    loadUser();
    // Cursor blinking effect
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Handle input change and show hints
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCurrentInput(value);
    
    if (value.trim().length > 0) {
      // Find matching commands
      const matchingCommands = Object.keys(commandHints).filter(cmd => 
        cmd.toLowerCase().startsWith(value.toLowerCase()) && cmd !== value
      );
      
      if (matchingCommands.length > 0) {
        const bestMatch = matchingCommands[0];
        setCurrentHint(`${bestMatch} - ${commandHints[bestMatch]}`);
        setShowHint(true);
      } else {
        setShowHint(false);
      }
    } else {
      setShowHint(false);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Load persistent terminal history
      await loadTerminalHistory(currentUser);
      
      addToOutput(`Welcome back to Ruby Terminal, ${currentUser.username || currentUser.email}!`);
      addToOutput("Cybertron Gem loaded successfully.");
      addToOutput("Type 'help' for available commands.");
    } catch (error) {
      await User.login();
    }
  };

  const loadTerminalHistory = async (currentUser) => {
    setIsLoadingHistory(true);
    try {
      const sessionHistory = await TerminalSession.filter(
        { user_email: currentUser.email },
        "session_order",
        100 // Load last 100 commands
      );

      if (sessionHistory.length > 0) {
        const restoredOutput = sessionHistory.map(session => ({
          text: session.output,
          type: session.output_type,
          timestamp: new Date(session.created_date).toLocaleTimeString()
        }));
        
        setOutput(restoredOutput);
        
        // Set session order to continue from where we left off
        const lastOrder = Math.max(...sessionHistory.map(s => s.session_order));
        setSessionOrder(lastOrder + 1);
        
        addToOutput("📚 Terminal history restored from previous session.", "system");
      }
    } catch (error) {
      console.error("Error loading terminal history:", error);
      addToOutput("⚠️ Could not restore terminal history.", "system");
    }
    setIsLoadingHistory(false);
  };

  const saveToHistory = async (command, outputText, outputType) => {
    if (!user || isLoadingHistory) return; // Don't save if no user or currently loading history
    
    try {
      await TerminalSession.create({
        user_email: user.email,
        command: command,
        output: outputText,
        output_type: outputType,
        session_order: sessionOrder
      });
      setSessionOrder(prev => prev + 1);
    } catch (error) {
      console.error("Error saving to terminal history:", error);
    }
  };

  const clearTerminalHistory = async () => {
    if (!user) {
      addToOutput("Please log in to clear history.", "error");
      return;
    }
    
    if (!confirm("Are you sure you want to clear your entire terminal history? This action cannot be undone.")) {
      addToOutput("Clear history cancelled.", "system");
      return;
    }
    
    try {
      const allSessions = await TerminalSession.filter({ user_email: user.email });
      
      for (const session of allSessions) {
        await TerminalSession.delete(session.id);
      }
      
      setOutput([]);
      setConversationContext([]);
      setSessionOrder(0); // Reset session order after clearing
      
      addToOutput("🗑️ Terminal history cleared successfully.", "system");
      addToOutput(`Welcome to Ruby Terminal, ${user?.username || user?.email}!`);
      addToOutput("Cybertron Gem loaded successfully.");
      addToOutput("Type 'help' for available commands.");
      
    } catch (error) {
      console.error("Error clearing terminal history:", error);
      addToOutput("❌ Error clearing terminal history. Please try again.", "error");
    }
  };

  const addToOutput = (text, type = "system") => {
    const timestamp = new Date().toLocaleTimeString();
    const newEntry = { text, type, timestamp };
    setOutput(prev => [...prev, newEntry]);
    
    // Auto-save to persistent storage (except for initial welcome messages added before history load)
    if (user && !isLoadingHistory && !text.includes("Welcome to Ruby Terminal") && !text.includes("Cybertron Gem loaded successfully.") && !text.includes("Type 'help' for available commands.") && !text.includes("Terminal history restored from previous session.")) {
      saveToHistory("", text, type); // For outputs, command can be empty or derived from context if needed
    }
  };

  const debugRubyCode = async (code, error) => {
    try {
      const debugResult = await InvokeLLM({
        prompt: `You are an expert Ruby debugger. Analyze this Ruby code that produced an error and provide:
        1. The specific issue causing the error
        2. A corrected version of the code
        3. An explanation of what went wrong
        4. Best practices to avoid similar errors
        
        Original code: ${code}
        Error: ${error}
        
        Provide helpful debugging information in a clear, educational format.`,
        response_json_schema: {
          type: "object",
          properties: {
            issue: { type: "string" },
            corrected_code: { type: "string" },
            explanation: { type: "string" },
            best_practices: { type: "array", items: { type: "string" } }
          }
        }
      });

      addToOutput("🔍 AUTO DEBUGGER ANALYSIS:", "system");
      addToOutput(`Issue: ${debugResult.issue}`, "system");
      addToOutput(`Corrected Code: ${debugResult.corrected_code}`, "system");
      addToOutput(`Explanation: ${debugResult.explanation}`, "system");
      if (debugResult.best_practices && debugResult.best_practices.length > 0) {
        addToOutput("Best Practices:", "system");
        debugResult.best_practices.forEach(practice => {
          addToOutput(`• ${practice}`, "system");
        });
      }
    } catch (debugError) {
      addToOutput("🔍 Auto debugger encountered an error", "error");
    }
  };

  const handleKeyDown = (e) => {
    if (isProcessing || isLoadingHistory) return;

    if (e.key === "Enter") {
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        if (newIndex === -1) {
          setCurrentInput("");
        } else {
          setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Auto-complete with hint
      if (showHint && currentHint && !awaitingConfirmation) {
        const command = currentHint.split(' - ')[0];
        setCurrentInput(command);
        setShowHint(false);
      }
    } else if (e.key === "Escape") {
      setShowHint(false);
    } else if (e.ctrlKey) {
      switch (e.key) {
        case "c":
          e.preventDefault();
          handleCopy();
          break;
        case "v": // Corrected from 'p' to 'v' for paste standard
          e.preventDefault();
          handlePaste();
          break;
        case "u":
          e.preventDefault();
          handleUndo();
          break;
        case "r":
          e.preventDefault();
          handleRedo();
          break;
        case "d":
          e.preventDefault();
          setAutoDebugEnabled(prev => {
            addToOutput(`Auto debugger ${!prev ? "enabled" : "disabled"}`, "system");
            return !prev;
          });
          break;
      }
    }
  };

  const isNaturalLanguage = (input) => {
    // Check if input contains natural language patterns
    const naturalLanguagePatterns = [
      /^(what|how|why|when|where|who|can|could|would|should|will|do|does|did|is|are|was|were|have|has|had)/i,
      /\b(please|help me|show me|tell me|explain|create|make|build|calculate|find|search|get|display)\b/i,
      /\?(.*)?$/,
      /^(i want|i need|i would like|let me|help|assist)/i
    ];
    
    // Check if it's clearly Ruby code
    const rubyCodePatterns = [
      /^(puts|print|p)\s/,
      /^(def|class|module|if|unless|while|until|for|begin)\s/,
      /=\s*[^\s]/,
      /\[[^\]]*\]|\{[^\}]*\}/,
      /\.(each|map|select|reject|find|reduce)/,
      /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*/,
      /^\s*(['"]).*\1$/, // Matches single or double quoted strings
      /^\s*(\d+(\.\d+)?)\s*$/, // Matches numbers
      /^\s*(:[a-zA-Z_][a-zA-Z0-9_]*)\s*$/ // Matches Ruby symbols
    ];
    
    const hasNaturalPattern = naturalLanguagePatterns.some(pattern => pattern.test(input));
    const hasRubyPattern = rubyCodePatterns.some(pattern => pattern.test(input));
    
    // If it has clear Ruby patterns, treat as code
    if (hasRubyPattern) return false;
    
    // If it has natural language patterns, treat as natural language
    if (hasNaturalPattern) return true;
    
    // Check word count and complexity - longer sentences are likely natural language
    const words = input.split(/\s+/).filter(word => word.length > 0).length;
    // Consider inputs with more than 3 words as natural language, unless it's a single keyword
    return words > 3 && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input.trim());
  };

  const processNaturalLanguage = async (input) => {
    const personalityPrompts = {
      assistant: "You are a helpful, balanced AI assistant",
      guru: "You are a seasoned code guru with deep technical expertise — be thorough and educational",
      creative: "You are a creative, imaginative AI with a flair for unique approaches and storytelling",
      hacker: "You are an elite cyberpunk hacker — use precise technical language with a cool cyberpunk aesthetic"
    };

    try {
      const result = await InvokeLLM({
        prompt: `${personalityPrompts[aiPersonality] || personalityPrompts.assistant} integrated into CyberRuby OS.

== CAPSULE CORP OPERATING SYSTEM COMPLETE KNOWLEDGE BASE ==
This is a cyberpunk-themed web-based terminal operating system called Capsule Corp OS. You MUST only answer based on what actually exists in this app.

CORE FEATURES:
1. Ruby Terminal — Execute Ruby code directly by typing it. Or describe tasks in natural language and the AI converts them to Ruby. Supports full Ruby 3.2.0 syntax.
2. AI Assistant — That is you. Answer questions, generate Ruby, explain code, debug errors, and help users navigate the OS. Supports 4 personality modes.
3. File System — Persistent cloud file storage per user with directory navigation. Upload, download, list, rename, move, delete, and share files.
4. SHD Wallet & Economy — SHD (Shards) is the in-app cryptocurrency. Users earn SHD based on registration order. Trade, transfer, or cash out SHD.
5. Orbit Messenger — Real-time chat with other users or AI. Send messages, share files, receive notifications. Opens via messenger icon (bottom right).
6. Roulette Game — Gamble SHD using chips and platinum bars. Place bets on a roulette table with inside/outside bets. Convert chips/bars to SHD. Opens via roulette icon (bottom left).
7. Marketplace — Buy and sell digital assets (files, designs, documents, media) for SHD tokens. List items with title, description, price, and file.
8. Leaderboard — View top 10 SHD earners ranked by balance. Shows medals for top 3 (gold, silver, bronze). Type 'leaderboard' command.
9. SHD Analytics Dashboard — Detailed transaction history, charts, and statistics. Shows sent/received amounts, balance trends, transaction types. Type 'analytics' command.
10. Theme System — 4 terminal themes: cyberpunk (cyan on indigo, default), matrix (green on black), amber (gold on dark brown), midnight (purple on very dark).
11. AI Personalities — 4 modes: assistant (balanced, default), guru (technical deep dives), creative (imaginative, storytelling), hacker (cyberpunk aesthetic, elite h4ck3r vibe).
12. Terminal Extensions — Save any AI-generated Ruby code as reusable custom commands. Run them anytime with 'ext run [name]'.
13. Auto Debugger — Automatically analyzes Ruby errors and provides fixes, explanations, and best practices. Toggle with 'debug toggle' or Ctrl+D.
14. Session History — All commands, outputs, and interactions auto-saved to cloud. Restored automatically on next login. Can be cleared permanently.
15. Cybertron Gem — Pre-installed Ruby gem with special commands for accessing wallet, terminal info, and SHD operations.

TERMINAL COMMANDS (these are the ONLY valid commands — do not invent others):
🔧 HELP & SYSTEM:
  help / help ruby           — Show available commands or full Ruby syntax reference
  clear                      — Clear terminal screen (current session only)
  clear history              — Permanently delete ALL terminal history (cannot be undone)
  whoami                     — Show current user info, email, SHD balance, admin status
  gem list                   — List all installed Ruby gems (cybertron, rails, bundler, etc.)
  save                       — Confirm autosave status (autosave is always active)
  debug toggle               — Toggle auto-debugger on/off (Ctrl+D also works)

📁 FILE SYSTEM COMMANDS:
  ls                         — List all user's uploaded files with sizes and dates
  cat [filename]             — Show file details: URL, type, size, upload date
  upload                     — Open file upload dialog (also use Upload button)
  download [filename]        — Download a file to your device
  rm [filename]              — Delete a file permanently
  mkdir [dirname]            — Create and navigate into a virtual directory
  cd [path]                  — Navigate to a directory path
  cd ..                      — Go to parent directory
  cd / or cd ~               — Go to root directory
  mv [oldname] [newname]     — Rename or move a file
  share [filename] [email]   — Share a file with another user via Orbit Messenger

🤖 AI COMMANDS:
  ai summarize [filename]    — AI analyzes and summarizes a file
  ai explain [code/concept]  — AI explains Ruby code or any programming concept
  ai debug                   — AI debugs your most recent error with solutions
  set personality [type]     — Change AI mode: assistant / guru / creative / hacker

💰 SHD WALLET & ECONOMY:
  shard balance              — Check your current SHD (Shard) token balance
  leaderboard                — View top 10 users ranked by SHD balance (shows medals for top 3)
  analytics                  — Open SHD Analytics dashboard with charts and transaction history
  market list [file] [price] — List a file on Marketplace for sale in SHD
  (Note: SHD allocation based on registration order: 1st user=5M, 2-10=1M, 11-100=100K, 101-1000=10K, 1000+=1K)

🎨 THEMES:
  theme set cyberpunk        — Cyan on indigo background (default)
  theme set matrix           — Green on black background (Matrix style)
  theme set amber            — Warm gold on dark brown background
  theme set midnight         — Purple on very dark blue background

🔌 TERMINAL EXTENSIONS:
  ext save [name]            — Save the last AI-generated Ruby code as a reusable command
  ext run [name]             — Execute a saved extension command
  ext list                   — List all saved extension commands

SHD ECONOMY DETAILS:
- SHD is allocated to new users automatically on signup based on registration order
- 1st user: 5,000,000 SHD | Users 2-10: 1,000,000 SHD | Users 11-100: 100,000 SHD | Users 101-1000: 10,000 SHD | 1000+: 1,000 SHD
- SHD can be used in Roulette (converted to chips or platinum bars), traded on the Marketplace, or sent to other users
- Chips and Platinum Bars are Roulette-only currencies that can be exchanged back to SHD

ROULETTE DETAILS:
- Standard roulette table with inside and outside bets
- Bet with chips (purchased with SHD)
- Platinum bars are a premium currency with higher value

CURRENT SESSION:
User: ${user?.username || user?.email} | Balance: ${user?.shard_balance?.toLocaleString() || 0} SHD | AI Personality: ${aiPersonality} | Path: ${currentPath}
== END KNOWLEDGE BASE ==

Previous conversation: ${JSON.stringify(conversationContext.slice(-3))}
User message: "${input}"

Respond with a JSON object:
- "needs_clarification": boolean (only true if you genuinely cannot proceed without more info)
- "question": string (specific question if clarification needed)
- "ruby_code": string (executable Ruby code if the request is a programming task)
- "explanation": string (explanation of what the code does)
- "response": string (ALWAYS include — your conversational answer. If unsure, refer to the knowledge base above.)`,
        response_json_schema: {
          type: "object",
          properties: {
            needs_clarification: { type: "boolean" },
            question: { type: "string" },
            ruby_code: { type: "string" },
            explanation: { type: "string" },
            response: { type: "string" }
          },
          required: ["needs_clarification", "response"]
        }
      });

      return result;
    } catch (error) {
      console.error("Error processing natural language:", error);
      return {
        needs_clarification: false,
        response: "I'm having trouble processing that. Could you rephrase or use direct Ruby code?"
      };
    }
  };

  const executeCommand = async () => {
    if (!currentInput.trim()) return;

    const command = currentInput.trim();
    
    // Add to command history
    if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command) {
      setCommandHistory(prev => [...prev.slice(-49), command]); // Keep last 50 commands
    }
    setHistoryIndex(-1);
    
    const inputLine = `${user?.username || "user"}@ruby-terminal:~$ ${command}`;
    addToOutput(inputLine, "input");
    
    // Save command to persistent history
    if (user) {
      saveToHistory(command, inputLine, "input");
    }
    
    setCurrentInput("");
    setShowHint(false);
    setIsProcessing(true);

    try {
      // Handle confirmation responses
      if (awaitingConfirmation) {
        const confirmation = command.toLowerCase();
        if (confirmation === 'yes' || confirmation === 'y' || confirmation === 'execute' || confirmation === 'run') {
          addToOutput("🤖 Executing the Ruby code...", "system");
          
          // Execute the confirmed Ruby code
          const result = await InvokeLLM({
            prompt: `You are a Ruby interpreter with the Cybertron gem installed. Execute this Ruby code and return the output exactly as Ruby would: ${awaitingConfirmation.ruby_code}. If it's invalid Ruby code, return the error message. Be precise and accurate.`,
            response_json_schema: {
              type: "object",
              properties: {
                output: { type: "string" },
                error: { type: "string" },
                success: { type: "boolean" }
              }
            }
          });

          if (result.success) {
            addToOutput(result.output, "output");
          } else {
            addToOutput(`Error: ${result.error}`, "error");
            if (autoDebugEnabled) {
              await debugRubyCode(awaitingConfirmation.ruby_code, result.error);
            }
          }
          
          setAwaitingConfirmation(null);
          setIsProcessing(false);
          return;
        } else if (confirmation === 'no' || confirmation === 'n' || confirmation === 'cancel') {
          addToOutput("🤖 Command cancelled. How else can I help you?", "system");
          setAwaitingConfirmation(null);
          setIsProcessing(false);
          return;
        } else {
          addToOutput("🤖 Invalid response. Please type 'yes' to execute or 'no' to cancel the code.", "system");
          setIsProcessing(false);
          return;
        }
      }

      // Handle built-in commands first
      if (command.toLowerCase() === "help") {
        addToOutput("Available commands:", "system");
        addToOutput("- help: Show this help message", "system");
        addToOutput("- help ruby: Show comprehensive Ruby commands reference", "system");
        addToOutput("- clear: Clear terminal output (current session only)", "system");
        addToOutput("- clear history: Clear ALL terminal history permanently", "system"); // New help entry
        addToOutput("- save: Manually confirm session save (autosave is on by default)", "system"); // Added help entry for save
        addToOutput("- whoami: Show current user", "system");
        addToOutput("- gem list: List installed gems", "system");
        addToOutput("- shard balance: Show SHD balance", "system");
        addToOutput("- debug toggle: Toggle auto debugger", "system");
        addToOutput("- ls: List all files", "system");
        addToOutput("- cat [filename]: Display file contents", "system");
        addToOutput("- upload: Open file upload dialog", "system");
        addToOutput("- download [filename]: Download a file", "system");
        addToOutput("- rm [filename]: Delete a file", "system");
        addToOutput("- mkdir [dir] / cd [path] / cd .. / mv [old] [new]: Directory navigation", "system");
        addToOutput("- share [filename] [email]: Share file via Orbit Messenger", "system");
        addToOutput("- market list [filename] [price]: List file on Marketplace for SHD", "system");
        addToOutput("", "system");
        addToOutput("🤖 AI COMMANDS:", "system");
        addToOutput("- ai summarize [filename]: AI summarizes a file", "system");
        addToOutput("- ai explain [code]: AI explains code or concept", "system");
        addToOutput("- ai debug: AI debugs your last error", "system");
        addToOutput("- set personality [guru|creative|hacker|assistant]: Change AI mode", "system");
        addToOutput("", "system");
        addToOutput("🎨 CUSTOMIZATION:", "system");
        addToOutput("- theme set [cyberpunk|matrix|amber|midnight]: Change theme", "system");
        addToOutput("- ext save [name] / ext run [name] / ext list: Terminal extensions", "system");
        addToOutput("", "system");
        addToOutput("📊 ECONOMY & STATS:", "system");
        addToOutput("- leaderboard: View top SHD earners", "system");
        addToOutput("- analytics: Open SHD transaction dashboard", "system");
        addToOutput("- market / marketplace: View marketplace items for purchase", "system");
        addToOutput("", "system");
        addToOutput("- Any Ruby code: Execute Ruby commands", "system");
        addToOutput("- Natural language: Ask questions or describe what you want to do", "system");
        addToOutput("", "system");
        addToOutput("💬 Natural Language Examples:", "system");
        addToOutput("- 'Create an array of numbers from 1 to 10'", "system");
        addToOutput("- 'How do I calculate the sum of an array?'", "system");
        addToOutput("- 'Show me how to create a class for a person'", "system");
        addToOutput("- 'What's the difference between puts and print?'", "system");
        addToOutput("", "system");
        addToOutput("Tips:", "system");
        addToOutput("- Use Tab to auto-complete commands", "system");
        addToOutput("- Use Escape to hide hints", "system");
        addToOutput("- Use Arrow keys to navigate command history", "system");
        addToOutput("- Use Ctrl+D to toggle auto debugger", "system");
        addToOutput("- Start typing for command suggestions", "system");
        addToOutput("- Your command history is automatically saved", "system"); // New tip
      } else if (command.toLowerCase() === "help ruby") {
        addToOutput("=== RUBY COMMANDS & SYNTAX REFERENCE ===", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 BASIC OUTPUT:", "system");
        addToOutput("  puts 'Hello World'        # Print with newline", "system");
        addToOutput("  print 'Hello'             # Print without newline", "system");
        addToOutput("  p variable                # Inspect and print object", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 VARIABLES & DATA TYPES:", "system");
        addToOutput("  name = 'John'             # String", "system");
        addToOutput("  age = 25                  # Integer", "system");
        addToOutput("  price = 19.99             # Float", "system");
        addToOutput("  active = true             # Boolean", "system");
        addToOutput("  items = [1, 2, 3]         # Array", "system");
        addToOutput("  user = {name: 'John'}     # Hash", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 CONDITIONALS:", "system");
        addToOutput("  if condition", "system");
        addToOutput("    # code", "system");
        addToOutput("  elsif other_condition", "system");
        addToOutput("    # code", "system");
        addToOutput("  else", "system");
        addToOutput("    # code", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  unless condition          # Opposite of if", "system");
        addToOutput("    # code", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  case variable", "system");
        addToOutput("  when value1", "system");
        addToOutput("    # code", "system");
        addToOutput("  when value2", "system");
        addToOutput("    # code", "system");
        addToOutput("  else", "system");
        addToOutput("    # default", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 LOOPS:", "system");
        addToOutput("  while condition", "system");
        addToOutput("    # code", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  until condition", "system");
        addToOutput("    # code", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  for i in 1..5", "system");
        addToOutput("    puts i", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  5.times { |i| puts i }    # Block iteration", "system");
        addToOutput("  1.upto(5) { |i| puts i }  # Count up", "system");
        addToOutput("  5.downto(1) { |i| puts i }# Count down", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 METHODS:", "system");
        addToOutput("  def method_name(param1, param2 = default)", "system");
        addToOutput("    # code", "system");
        addToOutput("    return result", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  method_name(arg1, arg2)   # Call method", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 CLASSES & OBJECTS:", "system");
        addToOutput("  class Person", "system");
        addToOutput("    attr_accessor :name, :age", "system");
        addToOutput("    ", "system");
        addToOutput("    def initialize(name, age)", "system");
        addToOutput("      @name = name", "system");
        addToOutput("      @age = age", "system");
        addToOutput("    end", "system");
        addToOutput("    ", "system");
        addToOutput("    def greet", "system");
        addToOutput("      puts \"Hello, I'm #{@name}\"", "system");
        addToOutput("    end", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  person = Person.new('John', 25)", "system");
        addToOutput("  person.greet", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 ARRAY METHODS:", "system");
        addToOutput("  arr = [1, 2, 3, 4, 5]", "system");
        addToOutput("  arr.each { |item| puts item }", "system");
        addToOutput("  arr.map { |item| item * 2 }", "system");
        addToOutput("  arr.select { |item| item > 2 }", "system");
        addToOutput("  arr.reject { |item| item < 3 }", "system");
        addToOutput("  arr.find { |item| item > 3 }", "system");
        addToOutput("  arr.reduce(0) { |sum, item| sum + item }", "system");
        addToOutput("  arr.sort", "system");
        addToOutput("  arr.reverse", "system");
        addToOutput("  arr.push(6)    # or arr << 6", "system");
        addToOutput("  arr.pop        # Remove last", "system");
        addToOutput("  arr.length     # or arr.size", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 HASH METHODS:", "system");
        addToOutput("  hash = {name: 'John', age: 25}", "system");
        addToOutput("  hash[:name]               # Access value", "system");
        addToOutput("  hash[:city] = 'NYC'       # Add/update", "system");
        addToOutput("  hash.keys                 # Get all keys", "system");
        addToOutput("  hash.values               # Get all values", "system");
        addToOutput("  hash.each { |key, value| puts \"#{key}: #{value}\" }", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 STRING METHODS:", "system");
        addToOutput("  str = 'Hello World'", "system");
        addToOutput("  str.upcase                # 'HELLO WORLD'", "system");
        addToOutput("  str.downcase              # 'hello world'", "system");
        addToOutput("  str.capitalize            # 'Hello world'", "system");
        addToOutput("  str.length                # 11", "system");
        addToOutput("  str.include?('World')     # true", "system");
        addToOutput("  str.split(' ')            # ['Hello', 'World']", "system");
        addToOutput("  str.gsub('World', 'Ruby') # Replace", "system");
        addToOutput("  str.strip                 # Remove whitespace", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 MODULES & MIXINS:", "system");
        addToOutput("  module Greetings", "system");
        addToOutput("    def say_hello", "system");
        addToOutput("      puts 'Hello!'", "system");
        addToOutput("    end", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        addToOutput("  class Person", "system");
        addToOutput("    include Greetings", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 EXCEPTION HANDLING:", "system");
        addToOutput("  begin", "system");
        addToOutput("    # risky code", "system");
        addToOutput("  rescue StandardError => e", "system");
        addToOutput("    puts \"Error: #{e.message}\"", "system");
        addToOutput("  ensure", "system");
        addToOutput("    # always runs", "system");
        addToOutput("  end", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 BLOCKS, PROCS & LAMBDAS:", "system");
        addToOutput("  # Block", "system");
        addToOutput("  [1,2,3].each { |n| puts n }", "system");
        addToOutput("", "system");
        addToOutput("  # Proc", "system");
        addToOutput("  my_proc = Proc.new { |n| puts n * 2 }", "system");
        addToOutput("  my_proc.call(5)", "system");
        addToOutput("", "system");
        addToOutput("  # Lambda", "system");
        addToOutput("  my_lambda = lambda { |n| n * 2 }", "system");
        addToOutput("  puts my_lambda.call(5)", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 FILE I/O:", "system");
        addToOutput("  File.open('file.txt', 'w') { |f| f.write('Hello') }", "system");
        addToOutput("  content = File.read('file.txt')", "system");
        addToOutput("  File.exist?('file.txt')", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 COMMON BUILT-IN CLASSES:", "system");
        addToOutput("  Time.now                  # Current time", "system");
        addToOutput("  Date.today                # Current date", "system");
        addToOutput("  Random.rand(10)           # Random 0-9", "system");
        addToOutput("  Math.sqrt(16)             # 4.0", "system");
        addToOutput("  JSON.parse(json_string)   # Parse JSON", "system");
        addToOutput("", "system");
        
        addToOutput("🔹 CYBERTRON GEM COMMANDS:", "system");
        addToOutput("  require 'cybertron'", "system");
        addToOutput("  Cybertron.version", "system");
        addToOutput("  Cybertron.shard_balance", "system");
        addToOutput("  Cybertron.ruby_terminal_info", "system");
        addToOutput("", "system");
        
        addToOutput("=== END OF RUBY REFERENCE ===", "system");
        addToOutput("Type any Ruby command to execute it!", "system");
      } else if (command.toLowerCase() === "clear") {
        setOutput([]);
        setConversationContext([]);
        setAwaitingConfirmation(null);
        addToOutput("Terminal screen cleared.", "system");
      } else if (command.toLowerCase() === "clear history") { // New command
        await clearTerminalHistory();
      } else if (command.toLowerCase() === "save") { // New save command
        addToOutput("💾 Autosave is active. Your session is saved automatically after each command.", "system");
      } else if (command.toLowerCase() === "whoami") {
        addToOutput(`Current user: ${user?.username || user?.email}`, "system");
        const balance = user?.shard_balance || 0;
        const balanceText = balance.toLocaleString();
        const balanceColor = getSHDColor(balance);
        addToOutput(`SHD Balance: ${balanceText}`, "system");
        addToOutput(`Admin: ${user?.is_admin ? "Yes" : "No"}`, "system");
      } else if (command.toLowerCase() === "gem list") {
        addToOutput("Installed gems:", "system");
        addToOutput("- cybertron (1.0.0)", "system");
        addToOutput("- bundler (2.4.0)", "system");
        addToOutput("- rails (7.0.0)", "system");
      } else if (command.toLowerCase() === "shard balance") {
        const balance = user?.shard_balance || 0;
        const balanceText = balance.toLocaleString();
        const balanceColor = getSHDColor(balance);
        addToOutput(`SHD Balance: ${balanceText}`, "system");
      } else if (command.toLowerCase() === "debug toggle") {
        setAutoDebugEnabled(prev => {
          addToOutput(`Auto debugger ${!prev ? "enabled" : "disabled"}`, "system");
          return !prev;
        });
      } else if (command.toLowerCase() === "ls") {
        // List all files
        const files = await File.filter({ owner_email: user.email });
        if (files.length === 0) {
          addToOutput("No files found. Use 'upload' to add files.", "system");
        } else {
          addToOutput("Files:", "system");
          files.forEach(file => {
            const sizeKB = (file.file_size / 1024).toFixed(2);
            addToOutput(`  ${file.filename} (${sizeKB} KB) - ${new Date(file.created_date).toLocaleDateString()}`, "output");
          });
          addToOutput(`Total: ${files.length} files`, "system");
        }
      } else if (command.toLowerCase().startsWith("cat ")) {
        // Display file contents
        const filename = command.substring(4).trim();
        if (!filename) {
          addToOutput("Usage: cat [filename]", "error");
        } else {
          const files = await File.filter({ owner_email: user.email, filename: filename });
          if (files.length === 0) {
            addToOutput(`File not found: ${filename}`, "error");
          } else {
            const file = files[0];
            addToOutput(`Content of ${filename}:`, "system");
            addToOutput(`File URL: ${file.file_url}`, "output");
            addToOutput(`Type: ${file.file_type || 'unknown'}`, "output");
            addToOutput(`Size: ${(file.file_size / 1024).toFixed(2)} KB`, "output");
            addToOutput(`Uploaded: ${new Date(file.created_date).toLocaleString()}`, "output");
          }
        }
      } else if (command.toLowerCase() === "upload") {
        addToOutput("Opening file upload dialog...", "system");
        fileInputRef.current?.click();
      } else if (command.toLowerCase().startsWith("download ")) {
        const filename = command.substring(9).trim();
        if (!filename) {
          addToOutput("Usage: download [filename]", "error");
        } else {
          const files = await File.filter({ owner_email: user.email, filename: filename });
          if (files.length === 0) {
            addToOutput(`File not found: ${filename}`, "error");
          } else {
            const file = files[0];
            addToOutput(`Downloading ${filename}...`, "system");
            window.open(file.file_url, '_blank');
          }
        }
      } else if (command.toLowerCase().startsWith("rm ")) {
        const filename = command.substring(3).trim();
        if (!filename) {
          addToOutput("Usage: rm [filename]", "error");
        } else {
          const files = await File.filter({ owner_email: user.email, filename: filename });
          if (files.length === 0) {
            addToOutput(`File not found: ${filename}`, "error");
          } else {
            await File.delete(files[0].id);
            addToOutput(`Deleted: ${filename}`, "system");
          }
        }

      // ── AI COMMANDS ──────────────────────────────────────────────
      } else if (command.toLowerCase().startsWith("ai summarize")) {
        const filename = command.substring(12).trim();
        if (!filename) {
          addToOutput("Usage: ai summarize [filename]", "error");
        } else {
          const files = await File.filter({ owner_email: user.email, filename });
          if (files.length === 0) {
            addToOutput(`File not found: ${filename}`, "error");
          } else {
            addToOutput(`🤖 Summarizing ${filename}...`, "system");
            const summary = await InvokeLLM({
              prompt: `Summarize and provide insights about this file for the user. Filename: ${filename}, Type: ${files[0].file_type || 'unknown'}, Size: ${(files[0].file_size / 1024).toFixed(2)} KB, Uploaded: ${new Date(files[0].created_date).toLocaleString()}. Be concise and useful.`
            });
            addToOutput(`📋 ${summary}`, "system");
          }
        }
      } else if (command.toLowerCase().startsWith("ai explain")) {
        const codeToExplain = command.substring(10).trim();
        if (!codeToExplain) {
          addToOutput("Usage: ai explain [code or concept]", "error");
        } else {
          addToOutput("🤖 Analyzing...", "system");
          const explanation = await InvokeLLM({
            prompt: `You are an expert Ruby teacher. Explain clearly and concisely: ${codeToExplain}`
          });
          addToOutput(`💡 ${explanation}`, "system");
        }
      } else if (command.toLowerCase() === "ai debug") {
        const lastError = [...output].reverse().find(o => o.type === "error");
        if (!lastError) {
          addToOutput("No recent errors found to debug.", "system");
        } else {
          addToOutput("🤖 Debugging last error...", "system");
          await debugRubyCode("", lastError.text);
        }

      // ── AI PERSONALITIES ──────────────────────────────────────────
      } else if (command.toLowerCase().startsWith("set personality ")) {
        const personality = command.substring(16).trim().toLowerCase();
        const valid = ['guru', 'creative', 'hacker', 'assistant'];
        if (!valid.includes(personality)) {
          addToOutput(`Invalid personality. Choose: ${valid.join(' | ')}`, "error");
        } else {
          setAiPersonality(personality);
          base44.analytics.track({ eventName: 'ai_personality_changed', properties: { personality } });
          const msgs = {
            guru: "🧙 Code Guru mode: Deep technical expertise activated.",
            creative: "🎨 Creative Writer mode: Imagination unleashed.",
            hacker: "💻 Cyberpunk Hacker mode: Elite h4ck3r online.",
            assistant: "🤖 Assistant mode: Balanced and helpful."
          };
          addToOutput(msgs[personality], "system");
        }

      // ── DIRECTORY COMMANDS ────────────────────────────────────────
      } else if (command.toLowerCase().startsWith("mkdir ")) {
        const dirname = command.substring(6).trim();
        if (!dirname) {
          addToOutput("Usage: mkdir [directory]", "error");
        } else {
          const newPath = currentPath === '/' ? `/${dirname}` : `${currentPath}/${dirname}`;
          setCurrentPath(newPath);
          addToOutput(`Directory created: ${newPath}`, "system");
        }
      } else if (command.toLowerCase() === "cd" || command.toLowerCase() === "cd ~" || command.toLowerCase() === "cd /") {
        setCurrentPath('/');
        addToOutput("Changed to: /", "system");
      } else if (command.toLowerCase() === "cd ..") {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
        setCurrentPath(newPath);
        addToOutput(`Changed to: ${newPath}`, "system");
      } else if (command.toLowerCase().startsWith("cd ")) {
        const path = command.substring(3).trim();
        const newPath = currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
        setCurrentPath(newPath);
        addToOutput(`Changed to: ${newPath}`, "system");
      } else if (command.toLowerCase().startsWith("mv ")) {
        const parts = command.substring(3).trim().split(' ');
        if (parts.length < 2) {
          addToOutput("Usage: mv [old_filename] [new_filename]", "error");
        } else {
          const [oldName, newName] = parts;
          const files = await File.filter({ owner_email: user.email, filename: oldName });
          if (files.length === 0) {
            addToOutput(`File not found: ${oldName}`, "error");
          } else {
            await File.update(files[0].id, { filename: newName });
            addToOutput(`Renamed: ${oldName} → ${newName}`, "system");
          }
        }

      // ── FILE SHARING ──────────────────────────────────────────────
      } else if (command.toLowerCase().startsWith("share ")) {
        const args = command.substring(6).trim().split(' ');
        if (args.length < 2) {
          addToOutput("Usage: share [filename] [user_email]", "error");
        } else {
          const [filename, targetEmail] = args;
          const files = await File.filter({ owner_email: user.email, filename });
          if (files.length === 0) {
            addToOutput(`File not found: ${filename}`, "error");
          } else {
            await Message.create({
              from_user: user.email,
              to_user: targetEmail,
              content: `📎 Shared file: ${filename}\nDownload: ${files[0].file_url}`,
              message_type: "user"
            });
            addToOutput(`✅ "${filename}" shared with ${targetEmail} via Orbit Messenger.`, "system");
          }
        }

      // ── MARKETPLACE ───────────────────────────────────────────────
      } else if (command.toLowerCase().startsWith("market list ")) {
        const parts = command.substring(12).trim().split(' ');
        if (parts.length < 2) {
          addToOutput("Usage: market list [filename] [price_in_SHD]", "error");
        } else {
          const filename = parts[0];
          const price = parseFloat(parts[1]) || 100;
          const files = await File.filter({ owner_email: user.email, filename });
          if (files.length === 0) {
            addToOutput(`File not found: ${filename}`, "error");
          } else {
            await MarketplaceItem.create({
              title: filename,
              description: `File: ${filename} (${files[0].file_type || 'file'}, ${(files[0].file_size / 1024).toFixed(2)} KB)`,
              price,
              seller_email: user.email,
              file_url: files[0].file_url,
              file_type: files[0].file_type || '',
              category: 'documents',
              status: 'active'
            });
            addToOutput(`✅ "${filename}" listed on Marketplace for ${price.toLocaleString()} SHD`, "system");
            addToOutput("Visit the Marketplace page to manage your listings.", "system");
          }
        }

      // ── ADMIN COMMANDS ────────────────────────────────────────────
      } else if (command.toLowerCase() === "admin reset-shd-all") {
        if (user?.is_admin) {
          if (!confirm("⚠️ WARNING: This will reset ALL users' SHD balances to original amounts. This cannot be undone. Continue?")) {
            addToOutput("Reset cancelled.", "system");
          } else {
            addToOutput("🔧 Resetting all SHD balances to original amounts...", "system");
            try {
              const result = await base44.functions.invoke('resetSHDToOriginal');
              addToOutput(`✅ ${result.message}`, "system");
              if (result.errors?.length > 0) {
                addToOutput("Errors encountered:", "system");
                result.errors.forEach(err => addToOutput(`  ⚠️ ${err}`, "error"));
              }
            } catch (error) {
              addToOutput(`❌ Reset failed: ${error.message}`, "error");
            }
          }
        } else {
          addToOutput("❌ Admin access required for this command.", "error");
        }
      
      // ── LEADERBOARD ───────────────────────────────────────────────
      } else if (command.toLowerCase() === "leaderboard") {
        base44.analytics.track({ eventName: 'leaderboard_viewed' });
        setShowLeaderboard(true);

      // ── ANALYTICS ────────────────────────────────────────────────
      } else if (command.toLowerCase() === "analytics") {
        base44.analytics.track({ eventName: 'analytics_viewed' });
        window.location.href = createPageUrl('Analytics');

      // ── MARKETPLACE ───────────────────────────────────────────────
      } else if (command.toLowerCase() === "market" || command.toLowerCase() === "marketplace") {
        base44.analytics.track({ eventName: 'marketplace_viewed' });
        setShowMarketplace(true);

      // ── THEME ─────────────────────────────────────────────────────
      } else if (command.toLowerCase().startsWith("theme set ")) {
        const themeName = command.substring(10).trim().toLowerCase();
        const validThemes = ['cyberpunk', 'matrix', 'amber', 'midnight'];
        if (!validThemes.includes(themeName)) {
          addToOutput(`Invalid theme. Choose: ${validThemes.join(' | ')}`, "error");
        } else {
          setTheme(themeName);
          base44.analytics.track({ eventName: 'theme_changed', properties: { theme: themeName } });
          addToOutput(`🎨 Theme set to: ${themeName}`, "system");
        }

      // ── TERMINAL EXTENSIONS ───────────────────────────────────────
      } else if (command.toLowerCase().startsWith("ext save ")) {
        const extName = command.substring(9).trim();
        if (!extName) {
          addToOutput("Usage: ext save [name]", "error");
        } else if (!awaitingConfirmation?.ruby_code) {
          addToOutput("No pending generated code to save. Ask the AI to write code first, then 'ext save [name]' before running.", "error");
        } else {
          const saved = JSON.parse(localStorage.getItem('cyberruby_ext') || '{}');
          saved[extName] = awaitingConfirmation.ruby_code;
          localStorage.setItem('cyberruby_ext', JSON.stringify(saved));
          addToOutput(`✅ Extension saved: "${extName}". Run it anytime with: ext run ${extName}`, "system");
        }
      } else if (command.toLowerCase().startsWith("ext run ")) {
        const extName = command.substring(8).trim();
        const saved = JSON.parse(localStorage.getItem('cyberruby_ext') || '{}');
        if (!saved[extName]) {
          addToOutput(`Extension not found: "${extName}". Use 'ext list' to see all saved extensions.`, "error");
        } else {
          addToOutput(`🔌 Running extension: ${extName}`, "system");
          const result = await InvokeLLM({
            prompt: `You are a Ruby interpreter. Execute this Ruby code and return the output exactly: ${saved[extName]}`,
            response_json_schema: {
              type: "object",
              properties: { output: { type: "string" }, error: { type: "string" }, success: { type: "boolean" } }
            }
          });
          if (result.success) {
            addToOutput(result.output, "output");
          } else {
            addToOutput(`Error: ${result.error}`, "error");
          }
        }
      } else if (command.toLowerCase() === "ext list") {
        const saved = JSON.parse(localStorage.getItem('cyberruby_ext') || '{}');
        const names = Object.keys(saved);
        if (names.length === 0) {
          addToOutput("No extensions saved. Generate code with AI, then use 'ext save [name]'.", "system");
        } else {
          addToOutput("Saved extensions:", "system");
          names.forEach(n => addToOutput(`  → ext run ${n}`, "output"));
        }

      } else if (isNaturalLanguage(command)) {
        // Process natural language input
        addToOutput("🤖 Processing your request...", "system");
        
        const nlResult = await processNaturalLanguage(command);
        
        // Add to conversation context
        setConversationContext(prev => [
          ...prev.slice(-4), // Keep last 5 exchanges
          { user: command, assistant: nlResult.response }
        ]);
        
        // Display the response
        addToOutput(`🤖 ${nlResult.response}`, "system");
        
        if (nlResult.needs_clarification && nlResult.question) {
          addToOutput(`❓ ${nlResult.question}`, "system");
        } else if (nlResult.ruby_code) {
          addToOutput("", "system");
          addToOutput("📝 Generated Ruby Code:", "system");
          addToOutput(nlResult.ruby_code, "output");
          
          if (nlResult.explanation) {
            addToOutput("", "system");
            addToOutput(`💡 Explanation: ${nlResult.explanation}`, "system");
          }
          
          addToOutput("", "system");
          addToOutput("⚡ Would you like me to execute this code? (Type 'yes' to run, 'no' to cancel)", "system");
          
          setAwaitingConfirmation({
            ruby_code: nlResult.ruby_code,
            explanation: nlResult.explanation
          });
        }
      } else {
        // Execute as Ruby code directly
        const result = await InvokeLLM({
          prompt: `You are a Ruby interpreter with the Cybertron gem installed. Execute this Ruby code and return the output exactly as Ruby would: ${command}. If it's invalid Ruby code, return the error message. Be precise and accurate.`,
          response_json_schema: {
            type: "object",
            properties: {
              output: { type: "string" },
              error: { type: "string" },
              success: { type: "boolean" }
            }
          }
        });

        if (result.success) {
          addToOutput(result.output, "output");
        } else {
          addToOutput(`Error: ${result.error}`, "error");
          
          // Auto debugger for Ruby code errors
          if (autoDebugEnabled && result.error && !command.toLowerCase().includes("help")) {
            addToOutput("", "system");
            await debugRubyCode(command, result.error);
          }
        }
      }
    } catch (error) {
      addToOutput(`System error: ${error.message}`, "error");
      
      // Auto debugger for system errors
      if (autoDebugEnabled) {
        addToOutput("", "system");
        await debugRubyCode(command, error.message);
      }
    }

    setIsProcessing(false);
  };

  const handleCopy = () => {
    if (window.getSelection().toString()) {
      navigator.clipboard.writeText(window.getSelection().toString());
      addToOutput("Text copied to clipboard", "system");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCurrentInput(prev => prev + text);
    } catch (error) {
      addToOutput("Could not paste from clipboard", "error");
    }
  };

  const handleUndo = () => {
    setCurrentInput("");
    setShowHint(false);
    addToOutput("Input cleared", "system");
  };

  const handleRedo = () => {
    addToOutput("Redo not available", "system");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    addToOutput(`📤 Uploading ${file.name}...`, "system");

    try {
      const result = await UploadFile({ file });
      
      await File.create({
        filename: file.name,
        file_url: result.file_url,
        file_size: file.size,
        file_type: file.type,
        path: "/",
        owner_email: user.email
      });

      addToOutput(`✅ File uploaded successfully: ${file.name}`, "system");
      addToOutput(`   Size: ${(file.size / 1024).toFixed(2)} KB`, "output");
      addToOutput(`   Type: ${file.type}`, "output");
      addToOutput(`   Use 'ls' to see all files or 'cat ${file.name}' to view details`, "system");
    } catch (error) {
      addToOutput(`❌ Upload failed: ${error.message}`, "error");
    }

    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getOutputColor = (type) => {
    switch (type) {
      case "input": return "text-cyan-400";
      case "output": return "text-green-400";
      case "error": return "text-red-400";
      case "system": return "text-yellow-400";
      default: return "text-white";
    }
  };

  const getSHDColor = (balance) => {
    if (balance >= 1_000_000_000) return "text-red-600 bloom-glow"; // 1 billion or over - ruby red
    if (balance >= 1_000_000) return "text-cyan-400 bloom-glow"; // 1 million or over - cyan
    if (balance >= 100_000) return "text-white bloom-glow"; // 100k or over - white
    return "text-yellow-400"; // below 100k - yellow
  };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden" style={{ background: THEME_CONFIG[theme]?.bg || '#312e81' }}>
      {/* Pouch Popup */}
      <PouchPopup isOpen={showPouch} onClose={() => setShowPouch(false)} user={user} />
      
      {/* Messenger Popup */}
      <MessengerPopup 
        isOpen={showMessenger} 
        isMinimized={messengerMinimized}
        onClose={() => { setShowMessenger(false); setMessengerMinimized(false); }}
        onMinimize={() => setMessengerMinimized(!messengerMinimized)}
        user={user}
      />
      
      {/* Profile Popup */}
      <ProfilePopup
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={loadUser}
      />
      
      {/* Leaderboard Popup */}
      <LeaderboardPopup
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        user={user}
      />

      {/* Marketplace Popup */}
      <MarketplacePopup
        isOpen={showMarketplace}
        isMinimized={marketplaceMinimized}
        onClose={() => { setShowMarketplace(false); setMarketplaceMinimized(false); }}
        onMinimize={() => setMarketplaceMinimized(!marketplaceMinimized)}
        user={user}
      />

      {/* Roulette Popup */}
      <RoulettePopup
        isOpen={showRoulette}
        isMinimized={rouletteMinimized}
        onClose={() => { setShowRoulette(false); setRouletteMinimized(false); }}
        onMinimize={() => setRouletteMinimized(!rouletteMinimized)}
        user={user}
      />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
              {/* Profile Button - Capsule Corp Logo */}
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="hover:scale-110 transition-transform"
                title="Profile"
              >
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/bcbde081c_CapsuleCorpLogo.png" 
                  alt="Capsule Corp" 
                  className="w-10 h-10 object-contain"
                />
              </button>
              <h1 className="text-2xl font-bold text-white bloom-glow font-mono">
                CAPSULE CORP OPERATING SYSTEM
              </h1>
            </div>
          <div className="flex items-center gap-2">
            {/* Pouch Button */}
            <button
              onClick={() => setShowPouch(!showPouch)}
              className="hover:scale-110 transition-transform"
              title="SHD Pouch"
            >
              <img src={POUCH_LOGO} alt="Pouch" className="w-10 h-10 object-contain" />
            </button>
            <Button
              size="sm"
              variant="outline"
              className={`border-${autoDebugEnabled ? 'green' : 'red'}-400 text-${autoDebugEnabled ? 'green' : 'red'}-400 hover:bg-${autoDebugEnabled ? 'green' : 'red'}-400 hover:text-black font-mono`}
              onClick={() => {
                setAutoDebugEnabled(prev => {
                  addToOutput(`Auto debugger ${!prev ? "enabled" : "disabled"}`, "system");
                  return !prev;
                });
              }}
            >
              🔍 Debug: {autoDebugEnabled ? "ON" : "OFF"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black font-mono"
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-mono"
              onClick={() => setShowMarketplace(true)}
              title="Marketplace"
            >
              🛍️ Market
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black font-mono"
              onClick={() => inputRef.current?.focus()}
            >
              <Play className="w-4 h-4 mr-2" />
              {awaitingConfirmation ? "Awaiting Confirmation" : "Ready"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            {isProcessing && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono">Processing...</span>
              </div>
            )}
            {isLoadingHistory && ( // New loading indicator
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono">Loading history...</span>
              </div>
            )}
          </div>
        </div>

        <div 
          ref={terminalRef}
          className="flex-1 bg-black/50 rounded-lg p-4 overflow-y-auto font-mono text-sm relative min-h-0"
          style={{ fontFamily: "JetBrains Mono, monospace", border: `1px solid ${THEME_CONFIG[theme]?.borderColor || 'rgba(0,255,255,0.4)'}`, boxShadow: THEME_CONFIG[theme]?.shadow }}
        >
          {output.map((line, index) => (
            <div key={index} className={`mb-1 ${getOutputColor(line.type)} bloom-glow`}>
              <span className="text-gray-500 text-xs mr-2">[{line.timestamp}]</span>
              {line.text}
            </div>
          ))}
          
          <div className="mt-8 pt-4 border-t border-gray-600 text-xs text-yellow-400 font-mono mb-4">
            <p className="mb-2">Available commands:</p>
            <p>shabeenashfak@cyberruby:~$ help</p>
            <p className="mt-2">Type 'help' for available commands.</p>
          </div>
          
          <div className="flex items-center mt-2 relative">
            <span className="bloom-glow" style={{ color: THEME_CONFIG[theme]?.accent || '#00FFFF' }}>
              {user?.username || "user"}@cyberruby:{currentPath}$
            </span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 ml-2 bg-transparent border-none outline-none text-white font-mono"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}
              disabled={isProcessing || isLoadingHistory} // Disabled when loading history
              placeholder={awaitingConfirmation ? "Type 'yes' to execute or 'no' to cancel..." : (isLoadingHistory ? "Loading terminal history..." : "Enter Ruby code or ask a question in natural language...")}
              autoFocus
            />
            <span className={`text-white ml-1 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>
              ▮
            </span>
            
            {/* Hint Display */}
            {showHint && currentHint && !awaitingConfirmation && (
              <div className="absolute top-6 left-0 right-0 bg-black/90 border border-yellow-400 rounded p-2 text-xs text-yellow-400 font-mono bloom-glow neon-border z-10">
                <div className="flex items-center justify-between">
                  <span>{currentHint}</span>
                  <span className="text-gray-500">Press Tab to complete or Esc to hide</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-cyan-400 font-mono bloom-glow bg-black/50 rounded-lg p-4 flex-shrink-0" style={{ border: `1px solid ${THEME_CONFIG[theme]?.borderColor || 'rgba(0,255,255,0.4)'}` }}>
          <p className="mb-2">🤖 AI Mode: Natural Language + Ruby Code | Shortcuts: Ctrl+C (Copy) | Ctrl+V (Paste) | Ctrl+U (Clear Input) | Ctrl+D (Toggle Debug) | Tab (Auto-complete) | Esc (Hide hints) | ↑↓ (History)</p>
          <p>Theme: <span style={{ color: THEME_CONFIG[theme]?.accent }}>{theme}</span> | AI: {aiPersonality} | Path: {currentPath} | Debug: {autoDebugEnabled ? "ON" : "OFF"} | 💾 Auto-Save: Active | Ruby v3.2.0</p>
        </div>
      </div>
      
      {/* Bottom Left - Roulette Button (inside terminal area) */}
      {!showRoulette && (
        <button
          onClick={() => setShowRoulette(true)}
          className="absolute bottom-20 left-8 hover:scale-110 transition-transform z-40"
          title="Roulette"
        >
          <img src={ROULETTE_LOGO} alt="Roulette" className="w-14 h-14 object-contain" />
        </button>
      )}
      
      {/* Bottom Right - Messenger Button (inside terminal area) */}
      {!showMessenger && (
        <button
          onClick={() => setShowMessenger(true)}
          className="absolute bottom-20 right-8 hover:scale-110 transition-transform z-40"
          title="Orbit Messenger"
        >
          <img src={MESSENGER_LOGO} alt="Messenger" className="w-14 h-14 object-contain rounded-full" />
        </button>
      )}
    </div>
  );
}