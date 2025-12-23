import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Loader2 } from "lucide-react";
import cosvysLogo from "@/assets/cosvys-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const phoneSchema = z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number");
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

/**
 * LoginScreen - Renders immediately, handles auth non-blockingly
 * All Supabase calls have timeouts and graceful fallbacks
 */
export default function LoginScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");

  // Check if user has dealer info (with graceful failure)
  const checkDealerAndNavigate = useCallback(async (userId: string) => {
    try {
      const { data: dealerInfo } = await supabase
        .from('dealer_info')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (dealerInfo) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dealer-info", { replace: true });
      }
    } catch (err) {
      console.warn("Dealer check failed, redirecting to dealer-info:", err);
      navigate("/dealer-info", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            if (mounted) checkDealerAndNavigate(session.user.id);
          }, 0);
        }
      }
    );

    // Quick non-blocking session check
    const checkSession = async () => {
      try {
        // Very short timeout - if backend is slow, just show login
        const timeout = new Promise<null>(resolve => 
          setTimeout(() => resolve(null), 2000)
        );
        
        const sessionCheck = supabase.auth.getSession();
        const result = await Promise.race([sessionCheck, timeout]);
        
        if (!mounted) return;
        
        if (result && 'data' in result && result.data?.session?.user) {
          // User already logged in, navigate
          checkDealerAndNavigate(result.data.session.user.id);
        } else {
          // No session or timeout - show login form
          setIsReady(true);
        }
      } catch {
        // Any error - just show login form
        if (mounted) setIsReady(true);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkDealerAndNavigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      if (data?.user) {
        toast({
          title: "Account created successfully!",
          description: "Please complete your dealer setup.",
        });
        navigate("/dealer-info", { replace: true });
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

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        toast({
          title: "Login successful!",
          description: "Redirecting...",
        });
        await checkDealerAndNavigate(data.user.id);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show brief loading while checking for existing session (max 2 seconds)
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <img 
            src={cosvysLogo} 
            alt="Cosvys" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
                    disabled={loading}
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
                      disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <Button 
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait...
                </span>
              ) : (
                isLogin ? "Login" : "Sign Up"
              )}
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
