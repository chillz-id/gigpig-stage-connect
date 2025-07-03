
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import Shows from '@/pages/Shows';
import Profile from '@/pages/Profile';
import CreateEvent from '@/pages/CreateEvent';
import Applications from '@/pages/Applications';
import AdminDashboard from '@/pages/AdminDashboard';
import EventDetail from '@/pages/EventDetail';
import ComedianProfile from '@/pages/ComedianProfile';
import ComedianProfileBySlug from '@/pages/ComedianProfileBySlug';
import DesignSystem from '@/pages/DesignSystem';
import Comedians from '@/pages/Comedians';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import { Suspense } from 'react';
import { useGlobalDesignSystem } from '@/hooks/useGlobalDesignSystem';
import DesignSystemStatusIndicator from '@/components/DesignSystemStatusIndicator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800 flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Component to initialize design system globally
const DesignSystemInitializer = ({ children }: { children: React.ReactNode }) => {
  useGlobalDesignSystem();
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <DesignSystemInitializer>
                <Router>
                  <div className="min-h-screen transition-all duration-200">
                    <Navigation />
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/shows" element={<Shows />} />
                        <Route path="/browse" element={<Navigate to="/shows" replace />} />
                        <Route path="/comedians" element={<Comedians />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/create-event" element={<CreateEvent />} />
                        <Route path="/applications" element={<Applications />} />
                        {/* Redirect old invoice routes to Profile */}
                        <Route path="/invoices" element={<Navigate to="/profile?tab=invoices" replace />} />
                        <Route path="/invoices/*" element={<Navigate to="/profile?tab=invoices" replace />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/design-system" element={<DesignSystem />} />
                        <Route path="/admin/events/:eventId" element={<EventDetail />} />
                        <Route path="/comedian/:slug" element={<ComedianProfileBySlug />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                    <Toaster />
                    <DesignSystemStatusIndicator />
                  </div>
                </Router>
              </DesignSystemInitializer>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
