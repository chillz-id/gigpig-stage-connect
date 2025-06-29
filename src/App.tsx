
import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";

// Eagerly loaded pages (most common)
import Browse from "./pages/Browse";
import Auth from "./pages/Auth";
import EventDetails from "./pages/EventDetails";

// Lazy loaded pages
const Comedians = lazy(() => import("./pages/Comedians"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const Applications = lazy(() => import("./pages/Applications"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Invoices = lazy(() => import("./pages/Invoices"));
const EventSeries = lazy(() => import("./pages/EventSeries"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Organizer = lazy(() => import("./pages/Organizer"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PromoterSettings = lazy(() => import("./pages/PromoterSettings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomizationSettings = lazy(() => import("./pages/CustomizationSettings"));
const ComedianProfile = lazy(() => import("./pages/ComedianProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function App() {
  
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
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Navigation />
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
                      <Routes>
                      <Route path="/" element={<Navigate to="/shows" replace />} />
                      <Route path="/shows" element={<Browse />} />
                      <Route path="/comedians" element={<Comedians />} />
                      <Route path="/comedian/:slug" element={<ComedianProfile />} />
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
                        path="/admin"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customization"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <CustomizationSettings />
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
                    </Suspense>
                  </div>
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
