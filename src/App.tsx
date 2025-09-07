import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import AddProjectScreen from "./components/AddProjectScreen";
import RoomMeasurementScreen from "./components/RoomMeasurementScreen";
import PaintEstimationScreen from "./components/PaintEstimationScreen";
import ProjectSummaryScreen from "./components/ProjectSummaryScreen";
import SavedProjectsScreen from "./components/SavedProjectsScreen";
import SettingsScreen from "./components/SettingsScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-project" element={<AddProjectScreen />} />
          <Route path="/room-measurement/:projectId" element={<RoomMeasurementScreen />} />
          <Route path="/paint-estimation/:projectId" element={<PaintEstimationScreen />} />
          <Route path="/project-summary/:projectId" element={<ProjectSummaryScreen />} />
          <Route path="/saved-projects" element={<SavedProjectsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
