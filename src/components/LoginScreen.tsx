import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, User } from "lucide-react";
import asianPaintsLogo from "@/assets/asian-paints-logo.png";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");

  const handleSendOTP = () => {
    if (mobile.length === 10) {
      setStep("otp");
    }
  };

  const handleVerifyOTP = () => {
    if (otp.length === 6) {
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src={asianPaintsLogo} 
          alt="Asian Paints" 
          className="h-16 w-auto object-contain"
        />
      </div>

      <Card className="w-full max-w-md eca-shadow-medium">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-foreground">
            {step === "mobile" ? "Login to ECA Pro" : "Verify OTP"}
          </CardTitle>
          <p className="text-muted-foreground">
            {step === "mobile" 
              ? "Enter your mobile number to continue" 
              : `OTP sent to +91 ${mobile}`
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "mobile" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mobile Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-10 h-12 text-base"
                    maxLength={10}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendOTP}
                className="w-full h-12 text-base font-medium"
                disabled={mobile.length !== 10}
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Enter OTP</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 text-base text-center tracking-wider"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleVerifyOTP}
                className="w-full h-12 text-base font-medium"
                disabled={otp.length !== 6}
              >
                Verify & Login
              </Button>

              <Button 
                variant="outline"
                onClick={() => setStep("mobile")}
                className="w-full h-12 text-base"
              >
                Change Mobile Number
              </Button>
            </>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="secondary"
            onClick={handleSkip}
            className="w-full h-12 text-base font-medium"
          >
            <User className="mr-2 h-4 w-4" />
            Skip for Offline Use
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6 px-4">
        By continuing, you agree to Asian Paints Terms of Service and Privacy Policy
      </p>
    </div>
  );
}