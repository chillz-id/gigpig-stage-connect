
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Browse from "./pages/Browse";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import Applications from "./pages/Applications";
import Invoices from "./pages/Invoices";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import PromoterSettings from "./pages/PromoterSettings";
import Marketplace from "./pages/Marketplace";
import Organizer from "./pages/Organizer";
import EventSeries from "./pages/EventSeries";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <ViewModeProvider>
                <UserProvider>
                  <div className="min-h-screen bg-background">
                    <Navigation />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route path="/events/:id" element={<EventDetails />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/create-event"
                        element={
                          <ProtectedRoute roles={['promoter']}>
                            <CreateEvent />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applications"
                        element={
                          <ProtectedRoute roles={['promoter']}>
                            <Applications />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/invoices"
                        element={
                          <ProtectedRoute roles={['promoter']}>
                            <Invoices />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/messages"
                        element={
                          <ProtectedRoute>
                            <Messages />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <Notifications />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/promoter-settings"
                        element={
                          <ProtectedRoute roles={['promoter']}>
                            <PromoterSettings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/organizer"
                        element={
                          <ProtectedRoute>
                            <Organizer />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/events/:id/series"
                        element={
                          <ProtectedRoute>
                            <EventSeries />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </UserProvider>
              </ViewModeProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
