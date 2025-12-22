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
import { useRetryWithWakeup } from "@/hooks/useRetryWithWakeup";
import { markConnectionActive } from "@/lib/supabaseConnection";

const phoneSchema = z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number");
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function LoginScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { retryState, executeWithRetry } = useRetryWithWakeup();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [reconnectMessage, setReconnectMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");

  const checkDealerAndNavigate = useCallback(async (userId: string) => {
    const { data: dealerInfo, error } = await executeWithRetry(
      async () => {
        const result = await supabase
          .from('dealer_info')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (result.error) throw result.error;
        markConnectionActive();
        return result.data;
      },
      { maxAttempts: 3, delayMs: 2000, timeoutMs: 10000 }
    );
    
    setLoading(false);
    setCheckingSession(false);
    
    if (error) {
      console.error("Dealer check failed after retries:", error);
      navigate("/dealer-info");
      return;
    }
    
    if (dealerInfo) {
      navigate("/dashboard");
    } else {
      navigate("/dealer-info");
    }
  }, [executeWithRetry, navigate]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setTimeout(() => {
            if (mounted) checkDealerAndNavigate(session.user.id);
          }, 0);
        } else {
          setCheckingSession(false);
        }
      }
    );

    // Quick session check - don't block on backend health
    const checkExistingSession = async () => {
      try {
        // Give a short timeout for session check
        const timeout = new Promise<null>(resolve => 
          setTimeout(() => resolve(null), 3000)
        );
        
        const sessionCheck = supabase.auth.getSession();
        const result = await Promise.race([sessionCheck, timeout]);
        
        if (!mounted) return;
        
        if (result && 'data' in result && result.data?.session?.user) {
          checkDealerAndNavigate(result.data.session.user.id);
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        console.warn("Session check error:", err);
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast, checkDealerAndNavigate]);

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

      const { data: signUpResult, error: signUpError } = await executeWithRetry(
        async () => {
          const result = await supabase.auth.signUp({
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
          
          if (result.error) throw result.error;
          return result.data;
        },
        { maxAttempts: 3, delayMs: 2000, timeoutMs: 15000 }
      );

      if (signUpError) throw signUpError;

      if (signUpResult?.user) {
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

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { data: loginResult, error: loginError } = await executeWithRetry(
        async () => {
          const result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (result.error) throw result.error;
          return result.data;
        },
        { maxAttempts: 3, delayMs: 2000, timeoutMs: 15000 }
      );

      if (loginError) throw loginError;

      if (loginResult?.user) {
        toast({
          title: "Login successful!",
          description: "Redirecting...",
        });
        // Navigate directly instead of relying only on onAuthStateChange
        await checkDealerAndNavigate(loginResult.user.id);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setLoading(false);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  // Determine what message to show
  const getLoadingMessage = () => {
    if (reconnectMessage) {
      return reconnectMessage;
    }
    if (retryState.isRetrying) {
      return retryState.message;
    }
    if (checkingSession) {
      return "Loading...";
    }
    return "Please wait...";
  };

  // Show loading while checking session or retrying
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
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-muted-foreground">{getLoadingMessage()}</p>
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
          {/* Show waking up message during retry */}
          {retryState.isRetrying && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-muted/50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{retryState.message}</span>
            </div>
          )}

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
                  {retryState.isRetrying ? retryState.message : "Please wait..."}
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
