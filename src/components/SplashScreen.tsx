import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import cosvysLogo from "@/assets/cosvys-logo.png";
import { supabase } from "@/integrations/supabase/client";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("Loading…");

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      // Brief splash screen delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (!mounted) return;

      setStatusMessage("Checking session…");

      try {
        // Quick session check with timeout
        const sessionCheck = supabase.auth.getSession();
        const timeout = new Promise<null>(resolve => 
          setTimeout(() => resolve(null), 5000)
        );
        
        const result = await Promise.race([sessionCheck, timeout]);
        
        if (!mounted) return;

        // If we got a session result and it has a session, go to dashboard
        if (result && 'data' in result && result.data?.session) {
          navigate("/dashboard", { replace: true });
        } else {
          // No session or timeout - go to login
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.warn("Session check failed:", err);
        if (mounted) {
          // On any error, just go to login
          navigate("/login", { replace: true });
        }
      }
    };

    initApp();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen eca-gradient flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 rounded-full bg-white/15"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white/10"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="transform transition-all duration-1000 scale-100 opacity-100">
          <img src={cosvysLogo} alt="Cosvys" className="h-24 w-auto object-contain" />
        </div>

        {/* App Title */}
        <div className="text-center transform transition-all duration-1000 delay-300 translate-y-0 opacity-100">
          <h1 className="text-4xl font-bold text-white mb-2">Cosvys</h1>
          <p className="text-white/90 text-lg font-medium">Minutes to Measure. Seconds to Estimate</p>
        </div>

        {/* Status Message */}
        <div className="flex items-center gap-2 text-white/80">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{statusMessage}</span>
        </div>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-center">
        <p className="text-white/70 text-sm">Version 1.0.0</p>
      </div>
    </div>
  );
}
