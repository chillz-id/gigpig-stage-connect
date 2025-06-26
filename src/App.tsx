
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import EventSeries from "./pages/EventSeries";
import Applications from "./pages/Applications";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Marketplace from "./pages/Marketplace";
import Invoices from "./pages/Invoices";
import PromoterSettings from "./pages/PromoterSettings";
import Pricing from "./pages/Pricing";
import Organizer from "./pages/Organizer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <UserProvider>
                <div className="min-h-screen bg-background font-sans antialiased">
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/event/:id" element={<EventDetails />} />
                    <Route path="/series/:id" element={<EventSeries />} />
                    <Route path="/organizer/:id" element={<Organizer />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/create-event" element={
                      <ProtectedRoute roles={['promoter', 'admin']}>
                        <CreateEvent />
                      </ProtectedRoute>
                    } />
                    <Route path="/applications" element={
                      <ProtectedRoute>
                        <Applications />
                      </ProtectedRoute>
                    } />
                    <Route path="/messages" element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    } />
                    <Route path="/invoices" element={
                      <ProtectedRoute>
                        <Invoices />
                      </ProtectedRoute>
                    } />
                    <Route path="/promoter-settings" element={
                      <ProtectedRoute roles={['promoter', 'admin']}>
                        <PromoterSettings />
                      </ProtectedRoute>
                    } />
                    
                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </UserProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
