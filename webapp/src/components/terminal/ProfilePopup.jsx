import React, { useState } from "react";
import { X, LogOut, Save, Loader2 } from "lucide-react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROFILE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6870dea75e7cf7b0574e0e6f/bcbde081c_CapsuleCorpLogo.png";

export default function ProfilePopup({ isOpen, onClose, user, onUserUpdate }) {
  const [username, setUsername] = useState(user?.username || "");
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({
        username: username,
        profile_picture: profilePicture
      });
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await User.logout();
  };

  return (
    <div className="absolute top-16 left-4 z-50 w-[300px]">
      <div className="bg-black/95 border-2 border-cyan-400 rounded-lg p-4 shadow-2xl"
        style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={PROFILE_LOGO} alt="Profile" className="w-8 h-8 object-contain" />
            <span className="text-cyan-400 font-mono font-bold text-sm">PROFILE</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-cyan-400 overflow-hidden bg-black/50">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cyan-400 text-2xl font-bold">
                {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-cyan-400 font-mono text-xs">Email</Label>
            <div className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-gray-700">
              {user?.email}
            </div>
          </div>

          <div>
            <Label className="text-cyan-400 font-mono text-xs">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/50 border-gray-600 text-white font-mono text-sm"
              placeholder="Enter username"
            />
          </div>

          <div>
            <Label className="text-cyan-400 font-mono text-xs">Profile Picture URL</Label>
            <Input
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              className="bg-black/50 border-gray-600 text-white font-mono text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-cyan-600 hover:bg-cyan-700 font-mono text-xs"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
              Save Changes
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full font-mono text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PROFILE_LOGO };