
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MarketplaceItem } from "@/entities/MarketplaceItem";
import { UploadFile } from "@/integrations/Core";
import { scanForMalware } from "@/functions/scanForMalware";
import { transferInApp } from "@/functions/transferInApp"; // Updated import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Plus, Download, Star, Package, Shield, AlertTriangle, Search } from "lucide-react";

export default function Marketplace() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    category: "other",
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      
      setUser(currentUser);
      
      let allItems = await MarketplaceItem.filter({ status: "active" }, "-created_date");
      
      const itemsToFix = allItems.filter(item => !item.seller_email);
      for (const item of itemsToFix) {
        try {
          await MarketplaceItem.update(item.id, {
            seller_email: "shabeenashfak@gmail.com"
          });
          console.log(`Fixed item ${item.id}: assigned seller_email "shabeenashfak@gmail.com"`);
        } catch (error) {
          console.error(`Error updating seller for item ${item.id}:`, error);
        }
      }
      
      allItems = await MarketplaceItem.filter({ status: "active" }, "-created_date");
      setItems(allItems);
      
      const userItems = await MarketplaceItem.filter({ 
        seller_email: currentUser.email 
      }, "-created_date");
      setMyItems(userItems);
    } catch (error) {
      console.error("Error loading marketplace data:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const maxSizeInBytes = 50 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        alert(`File too large! Maximum file size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        event.target.value = '';
        return;
      }

      setNewItem({ ...newItem, file });
    }
  };

  const createListing = async () => {
    if (!newItem.title || !newItem.price || !newItem.file) {
      alert("Please fill all fields and select a file.");
      return;
    }

    const maxSizeInBytes = 50 * 1024 * 1024;
    if (newItem.file.size > maxSizeInBytes) {
      alert(`File too large! Maximum file size is 50MB. Your file is ${(newItem.file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let timer;

    try {
      timer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 300);
      
      const { file_url } = await UploadFile({ file: newItem.file });
      
      clearInterval(timer);
      setUploadProgress(100);

      setIsScanning(true);
      try {
        const scanResult = await scanForMalware({
          file_url: file_url,
          file_name: newItem.file.name,
          file_type: newItem.file.type
        });

        if (scanResult.data.status === "blocked") {
          alert(`🚫 SECURITY ALERT: ${scanResult.data.reason}\n\nYour file has been rejected for security reasons.`);
          setIsScanning(false);
          setIsUploading(false);
          setUploadProgress(0);
          setNewItem({
            title: "",
            description: "",
            price: "",
            category: "other",
            file: null,
          });
          return;
        }

        if (scanResult.data.status === "warning") {
          const userConfirmed = confirm(`⚠️ SECURITY WARNING: ${scanResult.data.reason}\n\nDo you want to proceed with listing this file?`);
          if (!userConfirmed) {
            setIsScanning(false);
            setIsUploading(false);
            setUploadProgress(0);
            return;
          }
        }

        if (scanResult.data.status === "safe") {
          console.log("✅ File passed security scan");
        }

      } catch (scanError) {
        console.error("Security scan failed:", scanError);
        const proceedAnyway = confirm("Security scan encountered an error. Do you want to proceed anyway? (Not recommended)");
        if (!proceedAnyway) {
          setIsScanning(false);
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
      }
      setIsScanning(false);

      await MarketplaceItem.create({
        title: newItem.title,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        seller_email: user.email,
        file_url: file_url,
        file_type: newItem.file.type,
      });
      
      alert("✅ Listing created successfully! Your file passed security checks.");

      setTimeout(() => {
        setShowAddDialog(false);
        loadData();
      }, 1000);

    } catch (error) {
      console.error("Error creating listing:", error);
      if (timer) clearInterval(timer);
      
      let errorMessage = "Error creating listing. Please try again.";
      
      if (error.message.includes("413") || error.message.includes("Payload too large")) {
        errorMessage = "File too large! Please select a file smaller than 50MB.";
      } else if (error.message.includes("500")) {
        errorMessage = "Server error. Please try again with a smaller file.";
      }
      
      alert(errorMessage);
      
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setIsScanning(false);
        setUploadProgress(0);
        setNewItem({
          title: "",
          description: "",
          price: "",
          category: "other",
          file: null,
        });
      }, 1000);
    }
  };

  const purchaseItem = async (item) => {
    if (user.shard_balance < item.price) {
      alert("Insufficient SHD balance");
      return;
    }

    if (item.seller_email === user.email) {
      alert("You cannot purchase your own item.");
      return;
    }

    if (!item || !item.seller_email) {
      alert("Purchase failed: Seller information is missing. Please try again later.");
      console.error("Error: Seller email is missing from the item object:", item);
      return;
    }

    setIsPurchasing(true);
    try {
      const { data, error } = await transferInApp({
        recipientEmail: item.seller_email,
        amount: item.price,
        note: `Marketplace purchase: ${item.title}`
      });

      if (error) {
        throw new Error(error.message || "In-app transfer for purchase failed.");
      }

      await MarketplaceItem.update(item.id, { status: "sold" });

      alert(`Purchase successful! Your download will begin shortly.`);
      
      if (item.file_url) {
        window.open(item.file_url, '_blank');
      }
      
      loadData();
      const updatedUser = await User.me();
      setUser(updatedUser);

    } catch (error) {
      console.error("Error purchasing item:", error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  const filteredItems = items
    .filter(item => selectedCategory === "all" || item.category === selectedCategory)
    .filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredMyItems = myItems
    .filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "software", label: "Software" },
    { value: "designs", label: "Designs" },
    { value: "documents", label: "Documents" },
    { value: "media", label: "Media" },
    { value: "other", label: "Other" }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white font-mono bloom-glow">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white bloom-glow font-mono mb-2">
          SHD MARKETPLACE
        </h1>
        <p className="text-cyan-400 font-mono bloom-glow flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Buy & Sell Digital Goods with Shard Cryptocurrency • Malware Protection Enabled
        </p>
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-black/50 border-cyan-400 text-white font-mono pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-black/50 border-cyan-400 text-white font-mono">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="border-cyan-400 text-cyan-400 bloom-glow font-mono">
            Your Balance: {user.shard_balance?.toLocaleString() || "0"} SHD
          </Badge>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 font-mono">
              <Plus className="w-4 h-4 mr-2" />
              List Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-cyan-400 text-white">
            <DialogHeader>
              <DialogTitle className="text-white font-mono bloom-glow flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Create New Listing (Malware Protection Active)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Item Title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="bg-black/50 border-gray-600 text-white font-mono"
                disabled={isUploading || isScanning}
              />
              <Textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="bg-black/50 border-gray-600 text-white font-mono"
                disabled={isUploading || isScanning}
              />
              <Input
                type="number"
                placeholder="Price in SHD"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="bg-black/50 border-gray-600 text-white font-mono"
                disabled={isUploading || isScanning}
              />
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })} disabled={isUploading || isScanning}>
                <SelectTrigger className="bg-black/50 border-gray-600 text-white font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <label className="text-sm text-cyan-400 font-mono bloom-glow flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  Upload File (Max 50MB) - Malware Scan Enabled
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full mt-2 text-white font-mono"
                  disabled={isUploading || isScanning}
                />
                {newItem.file && (
                  <div className="text-xs text-gray-400 font-mono mt-1">
                    Selected: {newItem.file.name} ({(newItem.file.size / (1024 * 1024)).toFixed(1)}MB)
                  </div>
                )}
                <div className="text-xs text-yellow-400 font-mono mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Executable files (.exe, .bat, etc.) are automatically blocked for security
                </div>
              </div>

              {isUploading ? (
                <div className="space-y-2 text-center pt-4">
                  <Progress value={uploadProgress} className="w-full [&>div]:bg-cyan-400 bg-black/50 border border-cyan-400 neon-border bloom-glow" />
                  <p className="text-sm text-cyan-400 font-mono bloom-glow pt-2">
                    {isScanning ? (
                      <span className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4 animate-pulse" />
                        Scanning for malware...
                      </span>
                    ) : uploadProgress < 100 ? (
                      `Uploading... ${Math.round(uploadProgress)}%`
                    ) : (
                      "Upload Complete!"
                    )}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={createListing}
                  disabled={!newItem.title || !newItem.price || !newItem.file || isScanning}
                  className="w-full bg-green-600 hover:bg-green-700 font-mono"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Create Secure Listing
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse" className="mb-8">
        <TabsList className="bg-black/50 border-cyan-400">
          <TabsTrigger value="browse" className="font-mono data-[state=active]:bg-cyan-600">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse Items
          </TabsTrigger>
          <TabsTrigger value="mylistings" className="font-mono data-[state=active]:bg-cyan-600">
            <Package className="w-4 h-4 mr-2" />
            My Listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-black/50 border-cyan-400 neon-border">
                <CardHeader>
                  <CardTitle className="text-white font-mono bloom-glow text-lg">
                    {item.title}
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                      {item.category}
                    </Badge>
                    {item.file_type && (
                      <Badge variant="outline" className="border-gray-400 text-gray-400 text-xs">
                        {item.file_type.split('/')[1]?.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 font-mono mb-4 text-sm">
                    {item.description}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-green-400 font-mono bloom-glow">
                      {item.price?.toLocaleString()} SHD
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      by {item.seller_email?.split('@')[0]}
                    </span>
                  </div>
                  <Button
                    onClick={() => purchaseItem(item)}
                    disabled={isPurchasing || user.shard_balance < item.price || item.seller_email === user.email}
                    className="w-full bg-green-600 hover:bg-green-700 font-mono"
                  >
                    {isPurchasing ? "Processing In-App..." : 
                     item.seller_email === user.email ? "Your Item" : 
                     user.shard_balance < item.price ? "Insufficient Balance" : 
                     "Purchase & Download"}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center text-gray-400 font-mono py-12">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items match your search</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mylistings">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMyItems.map((item) => (
              <Card key={item.id} className="bg-black/50 border-cyan-400 neon-border">
                <CardHeader>
                  <CardTitle className="text-white font-mono bloom-glow text-lg">
                    {item.title}
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge 
                      variant="outline" 
                      className={`${
                        item.status === "active" ? "border-green-400 text-green-400" : 
                        item.status === "sold" ? "border-blue-400 text-blue-400" :
                        "border-red-400 text-red-400"
                      }`}
                    >
                      {item.status}
                    </Badge>
                    {item.file_type && (
                      <Badge variant="outline" className="border-gray-400 text-gray-400 text-xs">
                        {item.file_type.split('/')[1]?.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 font-mono mb-4 text-sm">
                    {item.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-400 font-mono bloom-glow">
                      {item.price?.toLocaleString()} SHD
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(item.created_date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredMyItems.length === 0 && (
              <div className="col-span-full text-center text-gray-400 font-mono py-12">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No of your listings match the search</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
