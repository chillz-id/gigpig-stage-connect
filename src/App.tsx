
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Browse from '@/pages/Browse';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import CreateEvent from '@/pages/CreateEvent';
import Applications from '@/pages/Applications';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import Pricing from '@/pages/Pricing';
import PromoterSettings from '@/pages/PromoterSettings';
import Marketplace from '@/pages/Marketplace';
import Invoices from '@/pages/Invoices';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
              <Navigation />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-event" element={<CreateEvent />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/promoter-settings" element={<PromoterSettings />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/invoices/*" element={<Invoices />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
