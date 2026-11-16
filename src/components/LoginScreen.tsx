
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import cosvysLogo from "@/assets/cosvys-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function LoginScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if dealer setup is complete
        const { data: dealerInfo } = await supabase
          .from('dealer_info')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (dealerInfo) {
          navigate("/dashboard");
        } else {
          navigate("/dealer-info");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Sign up did not return a user.");

      setVerificationCode("");
      setIsLogin(false);
      setAwaitingEmailVerification(true);
      toast({
        title: "Check your email",
        description: `Enter the verification code sent to ${email}.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Sign up failed",
        description:
          error instanceof Error ? error.message : "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      const code = verificationCode.trim();
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Please enter the 6-digit verification code.");
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (error) throw error;
      if (!data.user) throw new Error("Email verification did not return a user.");

      const { data: dealerInfo, error: dealerInfoError } = await supabase
        .from("dealer_info")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (dealerInfoError) throw dealerInfoError;
      navigate(dealerInfo ? "/dashboard" : "/dealer-info");
    } catch (error: unknown) {
      toast({
        title: "Verification failed",
        description:
          error instanceof Error ? error.message : "Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    setLoading(true);

    try {
      emailSchema.parse(email);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;
      toast({
        title: "Code sent",
        description: `A new verification code was sent to ${email}.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to resend code",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if dealer setup is complete
        const { data: dealerInfo } = await supabase
          .from('dealer_info')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        if (dealerInfo) {
          navigate("/dashboard");
        } else {
          navigate("/dealer-info");
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-6">
        <img 
          src={cosvysLogo} 
          alt="Cosvys" 
          className="h-20 w-auto object-contain"
        />
      </div>

      <Card className="w-full max-w-md eca-shadow-medium">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-foreground">
            {awaitingEmailVerification
              ? "Verify your email"
              : isLogin
                ? "Login to Cosvys"
                : "Create Account"}
          </CardTitle>
          <p className="text-muted-foreground">
            {awaitingEmailVerification
              ? `Enter the 6-digit code sent to ${email}`
              : isLogin
                ? "Enter your credentials to continue"
                : "Sign up to get started"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {awaitingEmailVerification ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Verification Code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-12 text-center tracking-[0.3em]"
                  maxLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerificationCode}
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                Resend Code
              </Button>
            </form>
          ) : (
            <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                  minLength={6}
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Re-enter Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                {loading ? "Please wait..." : (isLogin ? "Login" : "Sign Up")}
              </Button>
            </form>
          )}

          {!awaitingEmailVerification && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
          )}

          <Button 
            variant="outline"
            onClick={() => {
              setAwaitingEmailVerification(false);
              setVerificationCode("");
              setConfirmPassword("");
              setIsLogin(!isLogin);
            }}
            className="w-full h-12 text-base font-medium"
            disabled={loading}
          >
            {isLogin ? "Create New Account" : "Already have an account? Login"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6 px-4">
        By continuing, you agree to Asian Paints Terms of Service and Privacy Policy
      </p>
    </div>
  );
}