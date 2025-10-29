
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ActiveProfileProvider } from '@/contexts/ActiveProfileContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PWAInstaller } from '@/components/pwa/PWAInstaller';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { Suspense, useState, useEffect, lazy } from 'react';
import { useGlobalDesignSystem } from '@/hooks/useGlobalDesignSystem';
import { pwaService } from '@/services/pwaService';
import { initializeCDN } from '@/utils/cdnConfig';

// Eagerly load critical pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';

// Lazy load non-critical pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Gigs = lazy(() => import('@/pages/Gigs'));
const Shows = lazy(() => import('@/pages/Shows'));
const Profile = lazy(() => import('@/pages/Profile'));
const CreateEvent = lazy(() => import('@/pages/CreateEvent'));
const Applications = lazy(() => import('@/pages/Applications'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const TicketSalesTestPage = lazy(() => import('@/pages/admin/TicketSalesTestPage').then(module => ({ default: module.TicketSalesTestPage })));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const EventDetailPublic = lazy(() => import('@/pages/EventDetailPublic'));
const EditEvent = lazy(() => import('@/pages/EditEvent'));
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
const TestEventValidation = lazy(() => import('@/pages/TestEventValidation'));
const BookComedian = lazy(() => import('@/pages/BookComedian'));
const EventApplicationPage = lazy(() => import('@/pages/EventApplicationPage'));
const SpotConfirmationPage = lazy(() => import('@/pages/SpotConfirmationPage'));
const InvoicePaymentSuccess = lazy(() => import('@/pages/InvoicePaymentSuccess'));
const InvoicePaymentCancelled = lazy(() => import('@/pages/InvoicePaymentCancelled'));
const PostSignupSetup = lazy(() => import('@/pages/PostSignupSetup'));
const Settings = lazy(() => import('@/pages/Settings'));
const MediaLibrary = lazy(() => import('@/pages/MediaLibrary'));
const TaskDashboard = lazy(() => import('@/pages/TaskDashboard'));
const Vouches = lazy(() => import('@/pages/Vouches'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile'));
const NotFoundHandler = lazy(() => import('@/components/profile/NotFoundHandler').then(module => ({ default: module.NotFoundHandler })));
const SUSGigs = lazy(() => import('@/pages/SUSGigs'));
const SocialMedia = lazy(() => import('@/pages/SocialMedia'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes (gcTime alias)
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    }
  }
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
  // Initialize CDN on app mount
  useEffect(() => {
    initializeCDN();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <UserProvider>
                <ProfileProvider>
                  <ActiveProfileProvider>
                    <DesignSystemInitializer>
                      <Router
                        future={{
                          v7_startTransition: true,
                          v7_relativeSplatPath: true,
                        }}
                      >
                        <PWAIntegration />
                        <PlatformLayout>
                          <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                              {/* Profile URL Routes - MUST be first (highest priority) */}
                              <Route path="/comedian/:slug/*" element={<PublicProfile type="comedian" />} />
                              <Route path="/manager/:slug/*" element={<PublicProfile type="manager" />} />
                              <Route path="/organization/:slug/*" element={<PublicProfile type="organization" />} />
                              <Route path="/venue/:slug/*" element={<PublicProfile type="venue" />} />

                              {/* Static routes */}
                            <Route path="/" element={<Index />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/auth/google-calendar-callback" element={<GoogleCalendarCallback />} />
                            <Route path="/auth/xero-callback" element={<XeroCallback />} />
                            <Route path="/post-signup-setup" element={<PostSignupSetup />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/gigs" element={<Gigs />} />
                            <Route path="/shows" element={<Shows />} />
                            <Route path="/SUSgigs" element={<SUSGigs />} />
                            <Route path="/browse" element={<Navigate to="/gigs" replace />} />
                            <Route path="/comedians" element={<Comedians />} />
                            <Route path="/book-comedian" element={<BookComedian />} />
                            <Route path="/photographers" element={<Photographers />} />
                            <Route path="/photographers/:id" element={<PhotographerProfile />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/media-library" element={<ProtectedRoute><MediaLibrary /></ProtectedRoute>} />
                            <Route path="/social-media" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>} />
                            <Route path="/tasks" element={<ProtectedRoute><TaskDashboard /></ProtectedRoute>} />
                            <Route path="/vouches" element={<ProtectedRoute><Vouches /></ProtectedRoute>} />
                            <Route path="/create-event" element={<CreateEvent />} />
                            <Route path="/applications" element={<ProtectedRoute roles={['promoter', 'admin']}><Applications /></ProtectedRoute>} />
                            <Route path="/agency" element={<AgencyManagement />} />
                            <Route path="/dashboard/gigs/add" element={<ProtectedRoute roles={['comedian']}><AddGig /></ProtectedRoute>} />
                            {/* Invoice routes */}
                            <Route path="/invoices/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
                            <Route path="/invoices/:invoiceId/payment-success" element={<InvoicePaymentSuccess />} />
                            <Route path="/invoices/:invoiceId/payment-cancelled" element={<InvoicePaymentCancelled />} />
                            <Route path="/invoices" element={<Navigate to="/profile?tab=invoices" replace />} />
                            <Route path="/invoices/*" element={<Navigate to="/profile?tab=invoices" replace />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/ticket-sales" element={<ProtectedRoute roles={['admin']}><TicketSalesTestPage /></ProtectedRoute>} />
                            <Route path="/design-system" element={<DesignSystem />} />
                            <Route path="/test-events" element={<TestEventValidation />} />
                            <Route path="/settings/pwa" element={<PWASettings />} />
                            <Route path="/admin/events/:eventId" element={<EventDetail />} />
                            <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
                            <Route path="/events/:eventId/apply" element={<ProtectedRoute roles={['comedian']}><EventApplicationPage /></ProtectedRoute>} />
                            <Route path="/events/:eventId/confirm-spot" element={<ProtectedRoute roles={['comedian']}><SpotConfirmationPage /></ProtectedRoute>} />
                            <Route path="/events/:eventId" element={<EventDetailPublic />} />
                            <Route path="/spots/:spotId/confirm" element={<ProtectedRoute roles={['comedian']}><SpotConfirmationPage /></ProtectedRoute>} />
                            <Route path="/comedian/:slug" element={<ComedianProfileBySlug />} />
                            {/* 404 handler with profile request tracking */}
                            <Route path="*" element={<NotFoundHandler />} />
                          </Routes>
                        </Suspense>
                      </PlatformLayout>
                      <Toaster />
                    </Router>
                  </DesignSystemInitializer>
                </ActiveProfileProvider>
              </ProfileProvider>
              </UserProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
