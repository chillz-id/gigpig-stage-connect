
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Comedians from "./pages/Comedians";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import CreateEvent from "./pages/CreateEvent";
import Applications from "./pages/Applications";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Invoices from "./pages/Invoices";
import Auth from "./pages/Auth";
import EventDetails from "./pages/EventDetails";
import EventSeries from "./pages/EventSeries";
import Marketplace from "./pages/Marketplace";
import Organizer from "./pages/Organizer";
import Pricing from "./pages/Pricing";
import PromoterSettings from "./pages/PromoterSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <UserProvider>
                  <ViewModeProvider>
                    <div className="min-h-screen bg-background font-sans antialiased">
                      <Navigation />
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="/comedians" element={<Comedians />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/event/:id" element={<EventDetails />} />
                        <Route path="/series/:id" element={<EventSeries />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
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
                          path="/create-event"
                          element={
                            <ProtectedRoute>
                              <CreateEvent />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/applications"
                          element={
                            <ProtectedRoute>
                              <Applications />
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
                          path="/invoices"
                          element={
                            <ProtectedRoute>
                              <Invoices />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/marketplace"
                          element={
                            <ProtectedRoute>
                              <Marketplace />
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
                          path="/promoter-settings"
                          element={
                            <ProtectedRoute>
                              <PromoterSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </ViewModeProvider>
                </UserProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
