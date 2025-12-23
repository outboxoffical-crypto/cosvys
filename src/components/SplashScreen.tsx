import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import cosvysLogo from "@/assets/cosvys-logo.png";

/**
 * SplashScreen - Shows briefly then navigates to login
 * NO Supabase calls here - completely non-blocking
 */
export default function SplashScreen() {
  const navigate = useNavigate();
  const [statusMessage] = useState("Loading…");

  useEffect(() => {
    // Simply show splash for 1.2 seconds then go to login
    // Authentication check happens on LoginScreen, not here
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1200);

    return () => clearTimeout(timer);
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
