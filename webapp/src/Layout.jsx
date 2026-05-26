import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { processAllocations } from "@/functions/processAllocations";
import { 
  Sparkles,
  Loader2
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authError, setAuthError] = useState(null);

  const initializeApp = useCallback(async (attemptNumber = 0) => {
    try {
      console.log(`Initialization attempt ${attemptNumber + 1}`);
      
      // Add progressive delay for retries
      if (attemptNumber > 0) {
        const delay = Math.min(2000 * attemptNumber, 10000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      let currentUser;
      try {
        currentUser = await User.me();
      } catch (authError) {
        console.log("User not authenticated yet:", authError.message);
        setAuthError(authError.message);
        setIsInitializing(false);
        setShowLoginPrompt(true);
        return;
      }
      
      console.log("User fetched successfully:", currentUser?.email);
      
      // Check for whether a user needs initialization
      const needsInitialization = typeof currentUser.allocation_order !== 'number';
      const needsAllocation = !currentUser.initial_shd_allocated;

      console.log("User initialization check:", {
        email: currentUser.email,
        allocation_order: currentUser.allocation_order,
        initial_shd_allocated: currentUser.initial_shd_allocated,
        needsInitialization: needsInitialization,
        needsAllocation: needsAllocation
      });

      if (needsInitialization) {
        console.log(`Initializing user: ${currentUser.email}`);
        
        try {
          const isAdmin = currentUser.email === "shabeenashfak@gmail.com";
          
          let newAllocationOrder;

          if (isAdmin) {
            // Admin gets allocation order -1 (outside the main pool)
            newAllocationOrder = -1;
          } else {
            // Use processAllocations backend function to get allocation order (uses service role)
            try {
              const orderResult = await processAllocations({ action: "getNextOrder" });
              newAllocationOrder = typeof orderResult?.data?.nextOrder === 'number' ? orderResult.data.nextOrder : 0;
            } catch {
              // Fallback: use timestamp-based order to avoid User.list() permission error
              newAllocationOrder = Date.now() % 1000000;
            }
          }
          
          console.log(`Calculated allocation order: ${newAllocationOrder} for ${currentUser.email}`);

          // Update user data - DO NOT set shard_balance in database anymore
          const updateData = {
            username: currentUser.username || currentUser.email.split('@')[0],
            is_admin: isAdmin,
            allocation_order: newAllocationOrder,
            shard_balance: currentUser.shard_balance || 0, // Ensure shard_balance is initialized
            chips: currentUser.chips || 0,
            platinum_bars: currentUser.platinum_bars || 0
          };

          console.log("Updating user with data:", updateData);
          await User.updateMyUserData(updateData);
          
          console.log(`User ${currentUser.email} initialized successfully with allocation order ${newAllocationOrder}.`);
        } catch (initError) {
          console.error("Error during user initialization:", initError);
          setAuthError(`Initialization failed: ${initError.message}`);
          throw initError;
        }
      }

      // Only allocate SHD once per user (skip if manual reset was applied)
      if (needsAllocation && !needsInitialization && !currentUser.manual_reset_applied) {
        console.log(`Allocating initial SHD for ${currentUser.email}...`);
        try {
          const allocationResult = await processAllocations({ userEmail: currentUser.email });
          console.log("Allocation process finished for user:", allocationResult);
          
          // Mark that allocation has been done
          await User.updateMyUserData({ initial_shd_allocated: true });
        } catch (allocError) {
          console.error("Automated allocation failed:", allocError);
        }
      } else if (needsAllocation && needsInitialization && !currentUser.manual_reset_applied) {
        console.log(`Will allocate SHD after initialization for ${currentUser.email}...`);
        // --- AUTOMATED SHD ALLOCATION TRIGGER ---
        try {
          const allocationResult = await processAllocations({ userEmail: currentUser.email });
          console.log("Allocation process finished for new user:", allocationResult);
          
          // Mark that allocation has been done
          await User.updateMyUserData({ initial_shd_allocated: true });
        } catch (allocError) {
          console.error("Automated allocation failed for new user:", allocError);
        }
        // --- END OF ALLOCATION TRIGGER ---
        
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'CompleteRegistration');
        }
        
        // Track user registration with Google Analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'sign_up', {
            method: 'Google'
          });
        }
      } else {
        console.log(`User ${currentUser.email} already initialized with allocation order ${currentUser.allocation_order}`);
      }
      
      setIsInitializing(false);
      setShowLoginPrompt(false);
      setAuthError(null);
      setInitializationAttempts(0);
      
    } catch (error) {
      console.error("Initialization error:", error);
      setAuthError(error.message);
      
      // More intelligent retry logic
      if (attemptNumber < 4) { // 0-4 = 5 attempts total
        console.log(`Retrying initialization... (attempt ${attemptNumber + 2} of 5)`);
        setInitializationAttempts(attemptNumber + 1);
        
        setTimeout(() => {
          initializeApp(attemptNumber + 1);
        }, 1000 * (attemptNumber + 1));
      } else {
        console.log("Max initialization attempts reached. Showing login prompt.");
        setIsInitializing(false);
        setShowLoginPrompt(true);
      }
    }
  }, []);

  useEffect(() => {
    // Set browser tab title
    document.title = "CyberRuby OS";
  }, []);

  useEffect(() => {
    // Google Analytics initialization
    if (!window.gtag) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-VZH4S3P9HX';
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-VZH4S3P9HX');
      `;
      document.head.appendChild(script2);
    }

    // Facebook Pixel initialization
    !(function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)})(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', '283941079832267');
    window.fbq('track', 'PageView');

    // Initialize the app
    initializeApp(0);
  }, [initializeApp]);

  // Track page views with both Facebook Pixel and Google Analytics on route changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: currentPageName || document.title,
          page_location: window.location.href
        });
      }
    }
  }, [location.pathname, currentPageName]);

  const handleManualLogin = async () => {
    try {
      setAuthError(null);
      await User.login();
    } catch (error) {
      console.error("Manual login failed:", error);
      setAuthError(error.message);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center terminal-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin bloom-glow" />
          <p className="text-white font-mono text-lg">Initializing CyberRuby OS...</p>
          {initializationAttempts > 0 && (
            <p className="text-cyan-400 font-mono text-sm">
              Attempt {initializationAttempts + 1} of 5...
            </p>
          )}
          {authError && (
            <p className="text-red-400 font-mono text-sm max-w-md text-center">
              Connection issue: {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center terminal-bg">
        <div className="flex flex-col items-center gap-6 bg-black/70 p-8 rounded-lg border border-cyan-400 neon-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400 bloom-glow" />
            <h1 className="text-2xl font-bold text-white font-mono bloom-glow">
              Welcome to CyberRuby OS
            </h1>
          </div>
          <p className="text-cyan-400 font-mono text-center">
            Authentication required to access the system
          </p>
          {authError && (
            <p className="text-red-400 font-mono text-sm text-center max-w-md">
              Error: {authError}
            </p>
          )}
          <button
            onClick={handleManualLogin}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-mono px-6 py-3 rounded-lg border border-cyan-400 neon-border bloom-glow transition-all duration-200"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          :root {
            --indigo-bg: #4F46E5;
            --indigo-dark: #3730A3;
            --neon-cyan: #00FFFF;
            --neon-green: #00FF00;
            --neon-yellow: #FFFF00;
            --neon-red: #FF0000;
          }

          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

          .bloom-glow {
            text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
          }

          .terminal-bg {
            background: linear-gradient(135deg, var(--indigo-bg) 0%, var(--indigo-dark) 100%);
          }

          .neon-border {
            border: 1px solid var(--neon-cyan);
            box-shadow: 0 0 10px var(--neon-cyan);
          }

          .shard-yellow { color: var(--neon-yellow); }
          .shard-white { color: white; }
          .shard-green { color: var(--neon-green); }
          .shard-cyan { color: var(--neon-cyan); }
          .shard-red { color: var(--neon-red); }
        `}
      </style>

      {/* Facebook Pixel noscript fallback */}
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{display: 'none'}}
          src="https://www.facebook.com/tr?id=283941079832267&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      <div className="min-h-screen w-full terminal-bg">
        {children}
      </div>
    </>
  );
}