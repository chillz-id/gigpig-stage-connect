
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PWAInstaller } from '@/components/pwa/PWAInstaller';
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
const EPK = lazy(() => import('@/pages/EPK'));
const CreateEvent = lazy(() => import('@/pages/CreateEvent'));
const Applications = lazy(() => import('@/pages/Applications'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const TicketSalesTestPage = lazy(() => import('@/pages/admin/TicketSalesTestPage').then(module => ({ default: module.TicketSalesTestPage })));
const ComedianDirectoryPage = lazy(() => import('@/pages/ComedianDirectoryPage').then(module => ({ default: module.ComedianDirectoryPage })));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const EventDetailPublic = lazy(() => import('@/pages/EventDetailPublic'));
const EditEvent = lazy(() => import('@/pages/EditEvent'));
const EventManagement = lazy(() => import('@/pages/EventManagement'));
const EventNavigator = lazy(() => import('@/pages/EventNavigator'));
const ComedianProfile = lazy(() => import('@/pages/ComedianProfile'));
const ComedianProfileBySlug = lazy(() => import('@/pages/ComedianProfileBySlug'));
const ComedianProfileLayout = lazy(() => import('@/components/comedian-profile/ComedianProfileLayout').then(m => ({ default: m.ComedianProfileLayout })));
const ComedianEPKLayout = lazy(() => import('@/components/comedian-profile/ComedianEPKLayout'));
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));
const Comedians = lazy(() => import('@/pages/Comedians'));
const Messages = lazy(() => import('@/pages/Messages'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const AgencyManagement = lazy(() => import('@/pages/AgencyManagement'));
const AddGig = lazy(() => import('@/pages/AddGig'));
const MyGigs = lazy(() => import('@/pages/MyGigs'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const GoogleCalendarCallback = lazy(() => import('@/pages/GoogleCalendarCallback'));
const PWASettings = lazy(() => import('@/pages/PWASettings'));
const InvoiceForm = lazy(() => import('@/components/InvoiceForm'));
const XeroCallback = lazy(() => import('@/pages/XeroCallback'));
const Photographers = lazy(() => import('@/pages/Photographers'));
const PhotographerProfile = lazy(() => import('@/pages/PhotographerProfile'));
const TestEventValidation = lazy(() => import('@/pages/TestEventValidation'));
const MediaBrowserTest = lazy(() => import('@/pages/MediaBrowserTest'));
const BookComedian = lazy(() => import('@/pages/BookComedian'));
const EventApplicationPage = lazy(() => import('@/pages/EventApplicationPage'));
const SpotConfirmationPage = lazy(() => import('@/pages/SpotConfirmationPage'));
const InvoicePaymentSuccess = lazy(() => import('@/pages/InvoicePaymentSuccess'));
const InvoicePaymentCancelled = lazy(() => import('@/pages/InvoicePaymentCancelled'));
const PostSignupSetup = lazy(() => import('@/pages/PostSignupSetup'));
const Settings = lazy(() => import('@/pages/Settings'));
const MediaLibrary = lazy(() => import('@/pages/MediaLibrary'));
const TaskDashboard = lazy(() => import('@/pages/TaskDashboard'));
const SocialMedia = lazy(() => import('@/pages/SocialMedia'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile'));
const Roadmap = lazy(() => import('@/pages/Roadmap'));
const BugTracker = lazy(() => import('@/pages/BugTracker'));
const ABNChecker = lazy(() => import('@/pages/ABNChecker'));
const ComedianEvents = lazy(() => import('@/pages/ComedianEvents'));
const RecurringEvents = lazy(() => import('@/pages/RecurringEvents'));
const Tours = lazy(() => import('@/pages/Tours'));
const ComedianLinksPage = lazy(() => import('@/pages/ComedianLinksPage'));
const NotFoundHandler = lazy(() => import('@/components/profile/NotFoundHandler').then(module => ({ default: module.NotFoundHandler })));

// CRM Pages
const CRMLayout = lazy(() => import('@/components/crm/CRMLayout').then(module => ({ default: module.CRMLayout })));
const CustomerListPage = lazy(() => import('@/pages/crm/CustomerListPage').then(module => ({ default: module.CustomerListPage })));
const CustomerDetailPage = lazy(() => import('@/pages/crm/CustomerDetailPage').then(module => ({ default: module.CustomerDetailPage })));
const DealPipelinePage = lazy(() => import('@/pages/crm/DealPipelinePage').then(module => ({ default: module.DealPipelinePage })));
const TaskManagerPage = lazy(() => import('@/pages/crm/TaskManagerPage').then(module => ({ default: module.TaskManagerPage })));
const TaskDetailPage = lazy(() => import('@/pages/crm/TaskDetailPage').then(module => ({ default: module.TaskDetailPage })));
const RelationshipsPage = lazy(() => import('@/pages/crm/RelationshipsPage').then(module => ({ default: module.RelationshipsPage })));
const AnalyticsDashboardPage = lazy(() => import('@/pages/crm/AnalyticsDashboardPage').then(module => ({ default: module.AnalyticsDashboardPage })));
const ImportExportPage = lazy(() => import('@/pages/crm/ImportExportPage').then(module => ({ default: module.ImportExportPage })));
const SegmentsPage = lazy(() => import('@/pages/crm/SegmentsPage').then(module => ({ default: module.SegmentsPage })));

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
  <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Component to initialize design system globally
const DesignSystemInitializer = ({ children }: { children: React.ReactNode }) => {
  useGlobalDesignSystem();
  return <>{children}</>;
};

// Simple Routes wrapper - React Router handles re-rendering automatically
// NOTE: Previously had a key based on location.pathname which caused navigation issues
// React Router v6 handles route matching and re-rendering properly without manual keying
const RoutesWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Routes>{children}</Routes>;
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
                            <RoutesWrapper>
                              {/* Static routes - MUST be first to prevent wildcard route matching */}
                              <Route path="/" element={<Index />} />
                              <Route path="/auth" element={<Auth />} />
                              <Route path="/auth/callback" element={<AuthCallback />} />
                              <Route path="/auth/google-calendar-callback" element={<GoogleCalendarCallback />} />
                              <Route path="/auth/xero-callback" element={<XeroCallback />} />
                              <Route path="/post-signup-setup" element={<PostSignupSetup />} />
                              <Route path="/dashboard" element={<Dashboard />} />
                              <Route path="/my-gigs" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><MyGigs /></ProtectedRoute>} />
                              <Route path="/my-events" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><ComedianEvents /></ProtectedRoute>} />
                              <Route path="/recurring" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><RecurringEvents /></ProtectedRoute>} />
                              <Route path="/tours" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><Tours /></ProtectedRoute>} />
                              <Route path="/gigs" element={<Gigs />} />
                              <Route path="/shows" element={<Shows />} />
                              <Route path="/browse" element={<Navigate to="/gigs" replace />} />
                              <Route path="/comedians" element={<Comedians />} />
                              <Route path="/book-comedian" element={<BookComedian />} />
                              <Route path="/photographers" element={<Photographers />} />
                              <Route path="/photographers/:id" element={<PhotographerProfile />} />
                              <Route path="/messages" element={<Messages />} />
                              <Route path="/notifications" element={<Notifications />} />
                              {/* REMOVED: Profile editing now at /:profileType/:slug?tab=profile */}
                              {/* <Route path="/profile" element={<Profile />} /> */}
                              <Route path="/epk" element={<ProtectedRoute><EPK /></ProtectedRoute>} />
                              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                              <Route path="/media-library" element={<ProtectedRoute><MediaLibrary /></ProtectedRoute>} />
                              <Route path="/social-media" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>} />
                              <Route path="/tasks" element={<ProtectedRoute><TaskDashboard /></ProtectedRoute>} />
                              <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
                              <Route path="/bugs" element={<ProtectedRoute><BugTracker /></ProtectedRoute>} />
                              <Route path="/abn-checker" element={<ProtectedRoute><ABNChecker /></ProtectedRoute>} />
                              <Route path="/calendar" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><Calendar /></ProtectedRoute>} />
                              <Route path="/create-event" element={<CreateEvent />} />
                              <Route path="/applications" element={<ProtectedRoute roles={['admin']}><Applications /></ProtectedRoute>} />
                              <Route path="/agency" element={<AgencyManagement />} />
                              <Route path="/dashboard/gigs/add" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><AddGig /></ProtectedRoute>} />
                              {/* Invoice routes */}
                              <Route path="/invoices/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
                              <Route path="/invoices/:invoiceId/payment-success" element={<InvoicePaymentSuccess />} />
                              <Route path="/invoices/:invoiceId/payment-cancelled" element={<InvoicePaymentCancelled />} />
                              <Route path="/invoices" element={<Navigate to="/profile?tab=invoices" replace />} />
                              <Route path="/invoices/*" element={<Navigate to="/profile?tab=invoices" replace />} />
                              <Route path="/admin" element={<AdminDashboard />} />
                              <Route path="/admin/ticket-sales" element={<ProtectedRoute roles={['admin']}><TicketSalesTestPage /></ProtectedRoute>} />
                              <Route path="/admin/directory" element={<ProtectedRoute roles={['admin']}><ComedianDirectoryPage /></ProtectedRoute>} />
                              <Route path="/design-system" element={<DesignSystem />} />
                              <Route path="/test-events" element={<TestEventValidation />} />
                              <Route path="/test/media-browser" element={<ProtectedRoute><MediaBrowserTest /></ProtectedRoute>} />
                              <Route path="/settings/pwa" element={<PWASettings />} />
                              <Route path="/admin/events/:eventId" element={<EventDetail />} />
                              <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
                              <Route path="/events/:eventId/manage" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
                              <Route path="/events/navigate/:sourceType/:sourceId" element={<ProtectedRoute><EventNavigator /></ProtectedRoute>} />
                              <Route path="/events/:eventId/apply" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><EventApplicationPage /></ProtectedRoute>} />
                              <Route path="/events/:eventId/confirm-spot" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><SpotConfirmationPage /></ProtectedRoute>} />
                              <Route path="/events/:eventId" element={<EventDetailPublic />} />
                              <Route path="/spots/:spotId/confirm" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><SpotConfirmationPage /></ProtectedRoute>} />

                              {/* Comedian Profile Routes - Nested Structure */}
                              <Route path="/comedian/:slug" element={<ComedianProfileLayout />}>
                                {/* Default: Public EPK view */}
                                <Route index element={<ComedianEPKLayout />} />

                                {/* Profile editing - protected */}
                                <Route path="edit" element={<ProtectedRoute roles={['comedian', 'comedian_lite']}><Profile /></ProtectedRoute>} />

                                {/* Links page */}
                                <Route path="links" element={<ComedianLinksPage />} />
                              </Route>

                              {/* CRM Routes */}
                              <Route
                                path="/crm/*"
                                element={
                                  <ProtectedRoute roles={['admin', 'agency_manager', 'venue_manager']}>
                                    <CRMLayout />
                                  </ProtectedRoute>
                                }
                              >
                                <Route index element={<Navigate to="/crm/customers" replace />} />
                                <Route path="customers" element={<CustomerListPage />} />
                                <Route path="customers/:id" element={<CustomerDetailPage />} />
                                <Route path="deals" element={<DealPipelinePage />} />
                                <Route path="tasks" element={<TaskManagerPage />} />
                                <Route path="tasks/:id" element={<TaskDetailPage />} />
                                <Route path="relationships" element={<RelationshipsPage />} />
                                <Route path="analytics" element={<AnalyticsDashboardPage />} />
                                <Route path="import-export" element={<ImportExportPage />} />
                                <Route path="segments" element={<SegmentsPage />} />
                              </Route>

                              {/* Profile URL Routes with wildcards - AFTER static routes to prevent false matches */}
                              {/* Comedian routes now use nested routing via ComedianProfileLayout */}
                              {/* Keys force React to unmount/remount when switching between profile types */}
                              <Route path="/manager/:slug/*" element={<PublicProfile type="manager" key="manager-profile" />} />
                              <Route path="/org/:slug/*" element={<PublicProfile type="organization" />} />
                              <Route path="/venue/:slug/*" element={<PublicProfile type="venue" key="venue-profile" />} />
                              <Route path="/photographer/:slug/*" element={<PublicProfile type="photographer" key="photographer-profile" />} />

                              {/* 404 handler with profile request tracking */}
                              <Route path="*" element={<NotFoundHandler />} />
                            </RoutesWrapper>
                          </Suspense>
                        </PlatformLayout>
                        <Toaster />
                      </Router>
                    </DesignSystemInitializer>
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
