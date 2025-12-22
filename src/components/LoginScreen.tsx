import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";
import cosvysLogo from "@/assets/cosvys-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const phoneSchema = z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number");
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function LoginScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Defer database call to avoid deadlock
          setTimeout(() => {
            checkDealerAndNavigate(session.user.id);
          }, 0);
        } else {
          setCheckingSession(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setTimeout(() => {
            checkDealerAndNavigate(session.user.id);
          }, 0);
        } else {
          setCheckingSession(false);
        }
      })
      .catch((error) => {
        console.error("Session check failed:", error);
        setCheckingSession(false);
        toast({
          title: "Connection issue",
          description: "Could not connect to server. Please try again.",
          variant: "destructive",
        });
      });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const checkDealerAndNavigate = async (userId: string) => {
    // Add timeout to prevent hanging forever
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request timeout")), 10000)
    );

    try {
      const dealerPromise = supabase
        .from('dealer_info')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: dealerInfo, error } = await Promise.race([
        dealerPromise,
        timeoutPromise
      ]) as any;
      
      if (error) throw error;
      
      setLoading(false);
      setCheckingSession(false);
      
      if (dealerInfo) {
        navigate("/dashboard");
      } else {
        navigate("/dealer-info");
      }
    } catch (error) {
      console.error("Dealer check failed:", error);
      setLoading(false);
      setCheckingSession(false);
      // Still navigate to dealer-info as fallback
      navigate("/dealer-info");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);
      phoneSchema.parse(phone);
      
      if (!fullName.trim()) {
        throw new Error("Full name is required");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            phone,
            full_name: fullName.trim()
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Account created successfully!",
          description: "Please complete your dealer setup.",
        });
        navigate("/dealer-info");
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add timeout for entire login process
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Login timeout",
        description: "Request took too long. Please try again.",
        variant: "destructive",
      });
    }, 15000);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(loginTimeout);

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Login successful!",
          description: "Redirecting...",
        });
        // Navigate directly instead of relying only on onAuthStateChange
        await checkDealerAndNavigate(data.user.id);
      }
    } catch (error: any) {
      clearTimeout(loginTimeout);
      console.error("Login error:", error);
      setLoading(false);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <img 
            src={cosvysLogo} 
            alt="Cosvys" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src={cosvysLogo} 
          alt="Cosvys" 
          className="h-16 w-auto object-contain"
        />
      </div>

      <Card className="w-full max-w-md eca-shadow-medium">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-foreground">
            {isLogin ? "Login to Cosvys" : "Create Account"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Enter your credentials to continue" 
              : "Sign up to get started"
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                    required={!isLogin}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="pl-10 h-12"
                      maxLength={10}
                      required={!isLogin}
                    />
                  </div>
                </div>
              </>
            )}

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

            <Button 
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? "Please wait..." : (isLogin ? "Login" : "Sign Up")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full h-12 text-base font-medium"
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