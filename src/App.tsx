
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { Navigation } from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Browse from "./pages/Browse";
import Comedians from "./pages/Comedians";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import Applications from "./pages/Applications";
import Invoices from "./pages/Invoices";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Marketplace from "./pages/Marketplace";
import EventDetails from "./pages/EventDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UserProvider>
              <ViewModeProvider>
                <ErrorBoundary>
                  <div className="min-h-screen bg-background text-foreground">
                    <Navigation />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route path="/comedians" element={<Comedians />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/create-event" element={<CreateEvent />} />
                      <Route path="/applications" element={<Applications />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/event/:id" element={<EventDetails />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </ErrorBoundary>
              </ViewModeProvider>
            </UserProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
