import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Phone, MapPin, Home } from "lucide-react";

export default function AddProjectScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: "",
    mobile: "",
    address: "",
    projectType: "Interior" as "Interior" | "Exterior" | "Both"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.customerName && formData.mobile && formData.address) {
      // Store project data in localStorage for demo
      const projectId = Date.now().toString();
      localStorage.setItem(`project_${projectId}`, JSON.stringify({
        ...formData,
        id: projectId,
        createdAt: new Date().toISOString(),
        status: "In Progress"
      }));
      
      navigate(`/room-measurement/${projectId}`);
    }
  };

  const isFormValid = formData.customerName && formData.mobile.length === 10 && formData.address;

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
            <h1 className="text-xl font-semibold">New Project</h1>
            <p className="text-white/80 text-sm">Add customer details</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Customer Name *
                </Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      mobile: e.target.value.replace(/\D/g, '').slice(0, 10) 
                    }))}
                    className="pl-10 h-12"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                  <Textarea
                    id="address"
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="pl-10 min-h-[80px]"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Type */}
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Home className="mr-2 h-5 w-5 text-secondary" />
                Project Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.projectType}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  projectType: value as "Interior" | "Exterior" | "Both" 
                }))}
                className="grid grid-cols-1 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="Interior" id="interior" />
                  <Label htmlFor="interior" className="flex-1 cursor-pointer">
                    <div className="font-medium">Interior Only</div>
                    <div className="text-sm text-muted-foreground">Indoor walls, ceilings, rooms</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="Exterior" id="exterior" />
                  <Label htmlFor="exterior" className="flex-1 cursor-pointer">
                    <div className="font-medium">Exterior Only</div>
                    <div className="text-sm text-muted-foreground">Outer walls, facades, exteriors</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="Both" id="both" />
                  <Label htmlFor="both" className="flex-1 cursor-pointer">
                    <div className="font-medium">Interior + Exterior</div>
                    <div className="text-sm text-muted-foreground">Complete painting solution</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button 
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={!isFormValid}
            >
              Continue to Measurements
            </Button>
          </div>
        </form>
      </div>

      {/* Bottom padding to account for fixed button */}
      <div className="h-20"></div>
    </div>
  );
}