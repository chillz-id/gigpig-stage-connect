
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navigation from '@/components/Navigation';
import DockNavigation from '@/components/DockNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PWAInstaller } from '@/components/pwa/PWAInstaller';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { Suspense, useState, useEffect, lazy } from 'react';
import { useGlobalDesignSystem } from '@/hooks/useGlobalDesignSystem';
import { pwaService } from '@/services/pwaService';

// Eagerly load critical pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';

// Lazy load non-critical pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Shows = lazy(() => import('@/pages/Shows'));
const Profile = lazy(() => import('@/pages/Profile'));
const CreateEvent = lazy(() => import('@/pages/CreateEvent'));
const Applications = lazy(() => import('@/pages/Applications'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const EventDetailPublic = lazy(() => import('@/pages/EventDetailPublic'));
const ComedianProfile = lazy(() => import('@/pages/ComedianProfile'));
const ComedianProfileBySlug = lazy(() => import('@/pages/ComedianProfileBySlug'));
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));
const Comedians = lazy(() => import('@/pages/Comedians'));
const Messages = lazy(() => import('@/pages/Messages'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const AgencyManagement = lazy(() => import('@/pages/AgencyManagement'));
const AddGig = lazy(() => import('@/pages/AddGig'));
const GoogleCalendarCallback = lazy(() => import('@/pages/GoogleCalendarCallback'));
const PWASettings = lazy(() => import('@/pages/PWASettings'));
const InvoiceForm = lazy(() => import('@/components/InvoiceForm'));
const XeroCallback = lazy(() => import('@/pages/XeroCallback'));
const Photographers = lazy(() => import('@/pages/Photographers'));
const PhotographerProfile = lazy(() => import('@/pages/PhotographerProfile'));

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

// PWA Integration Component
const PWAIntegration = () => {
  const [showInstaller, setShowInstaller] = useState(false);
  const [capabilities, setCapabilities] = useState(pwaService.getCapabilities());

  useEffect(() => {
    const updateCapabilities = () => {
      setCapabilities(pwaService.getCapabilities());
    };

    // Show installer after 10 seconds if installable and not already shown
    const timer = setTimeout(() => {
      if (capabilities.isInstallable && !capabilities.isInstalled) {
        const hasShownInstaller = localStorage.getItem('pwa-installer-shown');
        if (!hasShownInstaller) {
          setShowInstaller(true);
          localStorage.setItem('pwa-installer-shown', 'true');
        }
      }
    }, 10000);

    // Listen for capability changes
    window.addEventListener('beforeinstallprompt', updateCapabilities);
    window.addEventListener('appinstalled', updateCapabilities);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', updateCapabilities);
      window.removeEventListener('appinstalled', updateCapabilities);
    };
  }, [capabilities.isInstallable, capabilities.isInstalled]);

  return (
    <>
      {/* Offline indicator in bottom right */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <OfflineIndicator />
      </div>

      {/* PWA installer modal */}
      {showInstaller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <PWAInstaller onClose={() => setShowInstaller(false)} />
          </div>
        </div>
      )}
    </>
  );
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
                    {/* <Navigation /> */}
                    <DockNavigation />
                    <PWAIntegration />
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/auth/google-calendar-callback" element={<GoogleCalendarCallback />} />
                        <Route path="/auth/xero-callback" element={<XeroCallback />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/shows" element={<Shows />} />
                        <Route path="/browse" element={<Navigate to="/shows" replace />} />
                        <Route path="/comedians" element={<Comedians />} />
                        <Route path="/photographers" element={<Photographers />} />
                        <Route path="/photographers/:id" element={<PhotographerProfile />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/create-event" element={<CreateEvent />} />
                        <Route path="/applications" element={<ProtectedRoute roles={['promoter', 'admin']}><Applications /></ProtectedRoute>} />
                        <Route path="/agency" element={<AgencyManagement />} />
                        <Route path="/dashboard/gigs/add" element={<ProtectedRoute roles={['comedian']}><AddGig /></ProtectedRoute>} />
                        {/* Invoice routes */}
                        <Route path="/invoices/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
                        <Route path="/invoices" element={<Navigate to="/profile?tab=invoices" replace />} />
                        <Route path="/invoices/*" element={<Navigate to="/profile?tab=invoices" replace />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/design-system" element={<DesignSystem />} />
                        <Route path="/settings/pwa" element={<PWASettings />} />
                        <Route path="/admin/events/:eventId" element={<EventDetail />} />
                        <Route path="/events/:eventId" element={<EventDetailPublic />} />
                        <Route path="/comedian/:slug" element={<ComedianProfileBySlug />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                    <Toaster />
                    {/* Add bottom padding for dock navigation */}
                    <div className="h-20 md:h-32" />
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
