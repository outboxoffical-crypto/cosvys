import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import cosvysLogo from "@/assets/cosvys-logo.png";
import { initializeConnection, refreshSession } from "@/lib/supabaseConnection";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [connectionFailed, setConnectionFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      // Show splash for minimum time
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 1500));

      // Initialize connection and refresh session
      const initPromise = initializeConnection((msg) => {
        if (mounted) setStatusMessage(msg);
      });

      // Wait for both minimum splash time and initialization
      const [, initResult] = await Promise.all([minSplashTime, initPromise]);

      if (!mounted) return;

      if (!initResult.backendReady) {
        setConnectionFailed(true);
        setStatusMessage("Unable to connect to server. Please check your internet connection.");
        setIsLoading(false);
        return;
      }

      // Fade out and navigate
      setStatusMessage("Ready!");
      setIsLoading(false);
      
      setTimeout(() => {
        if (mounted) {
          // If user has valid session, try to go to dashboard
          if (initResult.hasSession) {
            navigate("/dashboard");
          } else {
            navigate("/login");
          }
        }
      }, 300);
    };

    initApp();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleRetry = () => {
    setConnectionFailed(false);
    setIsLoading(true);
    setStatusMessage("Reconnecting…");
    
    initializeConnection((msg) => setStatusMessage(msg)).then((result) => {
      if (result.backendReady) {
        setIsLoading(false);
        setTimeout(() => {
          if (result.hasSession) {
            navigate("/dashboard");
          } else {
            navigate("/login");
          }
        }, 500);
      } else {
        setConnectionFailed(true);
        setStatusMessage("Unable to connect to server");
        setIsLoading(false);
      }
    });
  };

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
        <div className={`transform transition-all duration-1000 ${isLoading ? 'scale-100 opacity-100' : 'scale-110 opacity-90'}`}>
          <img src={cosvysLogo} alt="Cosvys" className="h-24 w-auto object-contain" />
        </div>

        {/* App Title */}
        <div className={`text-center transform transition-all duration-1000 delay-300 ${isLoading ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`}>
          <h1 className="text-4xl font-bold text-white mb-2">Cosvys</h1>
          <p className="text-white/90 text-lg font-medium">Minutes to Measure. Seconds to Estimate</p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="flex items-center gap-2 text-white/80">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="text-sm">{statusMessage}</span>
          </div>
        )}

        {/* Loading Animation */}
        {isLoading && !statusMessage && (
          <div className={`mt-12 transform transition-all duration-500 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        {/* Retry Button */}
        {connectionFailed && (
          <button
            onClick={handleRetry}
            className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors font-medium"
          >
            Retry Connection
          </button>
        )}
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-center">
        <p className="text-white/70 text-sm">Version 1.0.0</p>
      </div>
    </div>
  );
}
