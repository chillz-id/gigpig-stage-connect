
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
import Dashboard from '@/pages/Dashboard';
import Browse from '@/pages/Browse';
import Profile from '@/pages/Profile';
import CreateEvent from '@/pages/CreateEvent';
import Applications from '@/pages/Applications';
import Invoices from '@/pages/Invoices';
import AdminDashboard from '@/pages/AdminDashboard';
import EventDetail from '@/pages/EventDetail';
import ComedianProfile from '@/pages/ComedianProfile';
import ComedianProfileBySlug from '@/pages/ComedianProfileBySlug';
import DesignSystem from '@/pages/DesignSystem';
import { Suspense } from 'react';

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

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <Router>
                <div className="min-h-screen transition-all duration-200">
                  <Navigation />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route path="/shows" element={<Navigate to="/browse" replace />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/create-event" element={<CreateEvent />} />
                      <Route path="/applications" element={<Applications />} />
                      <Route path="/invoices/*" element={<Invoices />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route 
                        path="/design-system" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <DesignSystem />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/admin/events/:eventId" element={<EventDetail />} />
                      <Route path="/comedian/:slug" element={<ComedianProfileBySlug />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                  <Toaster />
                </div>
              </Router>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
