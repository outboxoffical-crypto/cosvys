import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  Settings, 
  DollarSign, 
  Ruler, 
  Cloud, 
  User,
  Bell,
  Shield,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import asianPaintsLogo from "@/assets/asian-paints-logo.png";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    unitPreference: "sqft" as "sqft" | "sqm",
    cloudBackup: true,
    notifications: true,
    autoSave: true,
    offlineMode: false
  });

  const [paintPrices, setPaintPrices] = useState({
    royaleAspira: 850,
    royaleLuxury: 720,
    apcolite: 580,
    tractor: 420,
    ace: 380
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handlePriceUpdate = (product: string, price: number) => {
    setPaintPrices(prev => ({ ...prev, [product]: price }));
  };

  const handleSavePrices = () => {
    toast({
      title: "Prices Updated",
      description: "Paint pricing has been updated successfully.",
    });
  };

  const handleCloudSync = () => {
    toast({
      title: "Cloud Sync",
      description: "Your data has been synced to the cloud.",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-white/80 text-sm">Customize your ECA Pro experience</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* User Profile Section */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="mr-2 h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">ECA User</p>
                <p className="text-sm text-muted-foreground">Asian Paints Associate</p>
                <p className="text-xs text-muted-foreground">ID: ECA001</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Unit Preferences */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Ruler className="mr-2 h-5 w-5 text-secondary" />
              Unit Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Measurement Units</Label>
              <RadioGroup
                value={settings.unitPreference}
                onValueChange={(value) => handleSettingChange("unitPreference", value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="sqft" id="sqft" />
                  <Label htmlFor="sqft" className="cursor-pointer">
                    <div className="font-medium">Square Feet</div>
                    <div className="text-xs text-muted-foreground">ft²</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="sqm" id="sqm" />
                  <Label htmlFor="sqm" className="cursor-pointer">
                    <div className="font-medium">Square Meters</div>
                    <div className="text-xs text-muted-foreground">m²</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Paint Pricing */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="mr-2 h-5 w-5 text-accent-foreground" />
              Update Paint Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Royale Aspira (₹/L)</Label>
                <Input
                  type="number"
                  value={paintPrices.royaleAspira}
                  onChange={(e) => handlePriceUpdate("royaleAspira", parseInt(e.target.value))}
                  className="w-24 h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Royale Luxury (₹/L)</Label>
                <Input
                  type="number"
                  value={paintPrices.royaleLuxury}
                  onChange={(e) => handlePriceUpdate("royaleLuxury", parseInt(e.target.value))}
                  className="w-24 h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Apcolite Premium (₹/L)</Label>
                <Input
                  type="number"
                  value={paintPrices.apcolite}
                  onChange={(e) => handlePriceUpdate("apcolite", parseInt(e.target.value))}
                  className="w-24 h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Tractor Emulsion (₹/L)</Label>
                <Input
                  type="number"
                  value={paintPrices.tractor}
                  onChange={(e) => handlePriceUpdate("tractor", parseInt(e.target.value))}
                  className="w-24 h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ace Exterior (₹/L)</Label>
                <Input
                  type="number"
                  value={paintPrices.ace}
                  onChange={(e) => handlePriceUpdate("ace", parseInt(e.target.value))}
                  className="w-24 h-8"
                />
              </div>
            </div>
            <Button onClick={handleSavePrices} className="w-full">
              Update Prices
            </Button>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="mr-2 h-5 w-5 text-primary" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive app notifications</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Auto Save</Label>
                <p className="text-xs text-muted-foreground">Automatically save project data</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Offline Mode</Label>
                <p className="text-xs text-muted-foreground">Work without internet connection</p>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={(checked) => handleSettingChange("offlineMode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cloud Backup */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Cloud className="mr-2 h-5 w-5 text-secondary" />
              Cloud Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Cloud Sync</Label>
                <p className="text-xs text-muted-foreground">Backup projects to cloud</p>
              </div>
              <Switch
                checked={settings.cloudBackup}
                onCheckedChange={(checked) => handleSettingChange("cloudBackup", checked)}
              />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Last sync: 2 hours ago</p>
              <p className="text-xs text-muted-foreground">5 projects backed up</p>
            </div>
            <Button variant="outline" onClick={handleCloudSync} className="w-full">
              Sync Now
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Info className="mr-2 h-5 w-5 text-accent-foreground" />
              About ECA Pro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <img 
                src={asianPaintsLogo} 
                alt="Asian Paints" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">ECA Pro</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground">© 2024 Asian Paints Ltd.</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                "Measure. Save. Calculate. Faster."
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="space-y-3">
          <Button variant="outline" onClick={handleLogout} className="w-full h-12">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="h-6"></div>
    </div>
  );
}