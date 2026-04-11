import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register service worker with optimized settings
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Prompt user for update
    if (confirm("New content available. Reload?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

// Optimize performance: defer non-critical initialization
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Initialize analytics or other non-critical services
  });
} else {
  setTimeout(() => {
    // Fallback for browsers that don't support requestIdleCallback
  }, 2000);
}

createRoot(document.getElementById("root")!).render(<App />);


