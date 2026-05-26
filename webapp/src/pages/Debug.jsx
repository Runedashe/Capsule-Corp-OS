import React, { useState } from "react";
import { User } from "@/entities/User";
import { processAllocations } from "@/functions/processAllocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle, UserPlus, Send } from "lucide-react";

export default function Debug() {
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleManualAllocation = async () => {
    if (!userEmail) {
      alert("Please enter a user's email.");
      return;
    }
    
    if (!confirm(`Are you sure you want to run the allocation process for ${userEmail}? This should only be used if the automatic process failed.`)) {
        return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const { data, error } = await processAllocations({ userEmail });

      if (error) {
        throw new Error(error.message || "An unknown error occurred");
      }
      
      setResult({ success: data.success, message: data.message });

    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white bloom-glow font-mono mb-2">
          ADMIN ALLOCATION PANEL
        </h1>
        <p className="text-cyan-400 font-mono bloom-glow">
          Manually trigger the SHD allocation process for a user.
        </p>
      </div>

      <Card className="bg-black/50 border-cyan-400 neon-border">
        <CardHeader>
          <CardTitle className="text-white font-mono bloom-glow flex items-center gap-3">
            <Send className="w-6 h-6"/>
            Manual User Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 font-mono text-sm">
            This tool is a fallback to grant a user their initial SHD if the automatic signup process fails. Enter the user's email and click the button to run the allocation script for them.
          </p>
          
          <div>
            <label className="text-sm text-cyan-400 font-mono bloom-glow">User Email to Allocate</label>
            <Input
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="bg-black/50 border-gray-600 text-white font-mono"
            />
          </div>
          
          <Button
            onClick={handleManualAllocation}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 font-mono text-lg py-4"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Processing...</> : "Run Allocation"}
          </Button>

          {result && (
            <div className={`p-4 mt-4 rounded-lg border ${result.success ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
              <div className="flex items-center gap-3">
                 {result.success ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                 <p className={`font-mono font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? "Success" : "Error"}
                 </p>
              </div>
              <p className="font-mono text-sm text-white mt-2 pl-8">{result.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}