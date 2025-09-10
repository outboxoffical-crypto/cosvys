import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Store, User, Phone, MapPin, Mail, Percent } from "lucide-react";
import asianPaintsLogo from "@/assets/asian-paints-logo.png";

export default function DealerInfoScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dealerName: "",
    shopName: "",
    employeeId: "",
    phone: "",
    address: "",
    email: "",
    margin: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dealerName && formData.shopName && formData.employeeId && formData.phone) {
      // Store dealer data
      localStorage.setItem('dealerInfo', JSON.stringify(formData));
      navigate("/dealer-pricing");
    }
  };

  const isFormValid = formData.dealerName && formData.shopName && formData.employeeId && formData.phone.length === 10;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src={asianPaintsLogo} 
            alt="Asian Paints" 
            className="h-8 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold">ECA Pro Setup</h1>
            <p className="text-white/80 text-sm">Dealer Information</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dealer Details */}
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Store className="mr-2 h-5 w-5 text-primary" />
                Dealer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dealerName" className="text-sm font-medium">
                  Dealer Name *
                </Label>
                <Input
                  id="dealerName"
                  placeholder="Enter dealer name"
                  value={formData.dealerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealerName: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-sm font-medium">
                  Shop Name *
                </Label>
                <Input
                  id="shopName"
                  placeholder="Enter shop name"
                  value={formData.shopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium">
                  Employee ID *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="employeeId"
                    placeholder="Enter employee ID"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10) 
                    }))}
                    className="pl-10 h-12"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Shop Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                  <Textarea
                    id="address"
                    placeholder="Enter complete shop address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email ID
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin" className="text-sm font-medium">
                  Dealer Margin (Optional, Max 10%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="margin"
                    type="number"
                    placeholder="0"
                    value={formData.margin}
                    onChange={(e) => {
                      const value = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                      setFormData(prev => ({ ...prev, margin: value.toString() }));
                    }}
                    className="pl-10 h-12"
                    min="0"
                    max="10"
                    step="0.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter percentage (0-10%). This will be applied to all product pricing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button 
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={!isFormValid}
            >
              Continue to Product Pricing
            </Button>
          </div>
        </form>
      </div>

      {/* Bottom padding to account for fixed button */}
      <div className="h-20"></div>
    </div>
  );
}