
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User as UserIcon, Save, Camera, Loader2, LogOut } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    profile_picture: "",
    animated_avatar: ""
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFormData({
        username: currentUser.username || "",
        profile_picture: currentUser.profile_picture || "",
        animated_avatar: currentUser.animated_avatar || ""
      });
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBalanceColor = (balance) => {
    if (!balance || balance < 1000) return "shard-red";
    if (balance < 100000) return "shard-yellow";
    if (balance < 1000000) return "shard-white";
    if (balance < 10000000) return "shard-green";
    if (balance < 100000000) return "shard-cyan";
    return "shard-yellow";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData(formData);
      await loadUser(); // Refresh user data
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [field]: file_url
      }));
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        await User.logout();
        // Assuming User.logout() handles redirection or session cleanup.
        // For a full application, you might want to redirect to a login page here:
        // window.location.href = "/login"; 
      } catch (error) {
        console.error("Error logging out:", error);
        alert("Error logging out. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin bloom-glow" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-cyan-400 neon-border">
            <AvatarImage src={user.profile_picture} />
            <AvatarFallback className="bg-gray-600">
              <UserIcon className="w-8 h-8 text-white" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-white bloom-glow font-mono mb-2">USER PROFILE</h1>
            <p className="text-cyan-400 font-mono bloom-glow">Manage your account settings and information.</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white font-mono"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-black/50 border-cyan-400 neon-border">
          <CardHeader>
            <CardTitle className="text-white font-mono bloom-glow">
              SHD BALANCE
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-4xl font-bold font-mono bloom-glow ${getBalanceColor(user.shard_balance)}`}>
              {user.shard_balance?.toLocaleString() || "0"}
            </div>
            <div className="text-sm text-gray-400 font-mono mt-1">
              SHD
            </div>
            <Badge variant="outline" className="border-cyan-400 text-cyan-400 mt-2">
              Allocation #{user.allocation_order > -1 ? user.allocation_order : "Admin"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-cyan-400 neon-border">
          <CardHeader>
            <CardTitle className="text-white font-mono bloom-glow">ACCOUNT INFO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 font-mono">Email:</span>
              <span className="text-white font-mono">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-mono">Role:</span>
              <Badge variant={user.is_admin ? "destructive" : "secondary"}>
                {user.is_admin ? "Admin" : "User"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-mono">Chips:</span>
              <span className="text-yellow-400 font-mono">{user.chips?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-mono">Platinum Bars:</span>
              <span className="text-white font-mono">{user.platinum_bars?.toLocaleString() || "0"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="edit" className="mb-8">
        <TabsList className="bg-black/50 border-cyan-400">
          <TabsTrigger value="edit" className="font-mono data-[state=active]:bg-cyan-600">Edit Profile</TabsTrigger>
          <TabsTrigger value="avatar" className="font-mono data-[state=active]:bg-cyan-600">Avatar Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit">
          <Card className="bg-black/50 border-cyan-400 neon-border">
            <CardHeader>
              <CardTitle className="text-white font-mono bloom-glow">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-cyan-400 font-mono bloom-glow mb-2 block">Username</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-black/50 border-gray-600 text-white font-mono"
                  placeholder="Enter your username"
                />
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 font-mono"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avatar">
          <Card className="bg-black/50 border-cyan-400 neon-border">
            <CardHeader>
              <CardTitle className="text-white font-mono bloom-glow">Avatar & Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-2 border-cyan-400">
                  <AvatarImage src={formData.profile_picture} />
                  <AvatarFallback className="bg-gray-600">
                    <UserIcon className="w-8 h-8 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-white font-mono mb-2">Profile Picture</h4>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0], 'profile_picture');
                      }
                    }}
                    className="bg-black/50 border-gray-600 text-yellow-400 font-mono file:bg-transparent file:border-0 file:text-yellow-400 file:font-mono"
                    disabled={uploadingImage}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-white font-mono mb-2">Animated Avatar URL</h4>
                <Input
                  value={formData.animated_avatar}
                  onChange={(e) => setFormData(prev => ({ ...prev, animated_avatar: e.target.value }))}
                  className="bg-black/50 border-gray-600 text-white font-mono"
                  placeholder="https://example.com/your-animated-avatar.gif"
                />
                {formData.animated_avatar && (
                  <div className="mt-2 p-2 bg-black/30 rounded border border-gray-600">
                    <img
                      src={formData.animated_avatar}
                      alt="Animated Avatar Preview"
                      className="w-16 h-16 rounded-full border border-cyan-400"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isSaving || uploadingImage}
                className="w-full bg-green-600 hover:bg-green-700 font-mono"
              >
                {isSaving || uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadingImage ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
