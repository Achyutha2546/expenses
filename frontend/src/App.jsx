import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/Transactions';
import Sources from './pages/Sources';
import Onboarding from './pages/Onboarding';
import History from './pages/History';
import Account from './pages/Account';
import Stats from './pages/Stats';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import Footer from './components/Footer';
import ReloadPrompt from './components/ReloadPrompt';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import LockScreen from './components/LockScreen';
import { Bell, X, ArrowRight } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/auth" />;
};

const PublicRoute = ({ children, redirectTo = "/dashboard", forceRedirect = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator.standalone === true) ||
                document.referrer.includes('android-app://') ||
                window.location.search.includes('mode=standalone');
                
  if (user && (forceRedirect || isPWA)) {
    return <Navigate to={redirectTo} />;
  }
  return children;
};

const ProtectedApp = ({ children }) => {
  const { isLocked } = useSecurity();
  return (
    <>
      {children}
      {isLocked && <LockScreen />}
    </>
  );
};

const ForegroundNotificationToast = () => {
  const { foregroundNotification, dismissNotification } = useNotifications();
  const navigate = useNavigate();

  if (!foregroundNotification) return null;

  const iconMap = {
    budget_exceeded: '🚨',
    budget_warning: '⚠️',
    daily_reminder: '📝',
    info: '🔔'
  };

  const emoji = iconMap[foregroundNotification.type] || '🔔';

  return (
    <div className="push-notification-toast" onClick={() => {
      navigate(foregroundNotification.link || '/dashboard');
      dismissNotification();
    }}>
      <div className="push-notification-icon">{emoji}</div>
      <div className="push-notification-content">
        <div className="push-notification-title">{foregroundNotification.title}</div>
        <div className="push-notification-body">{foregroundNotification.body}</div>
      </div>
      <button
        className="push-notification-dismiss"
        onClick={(e) => { e.stopPropagation(); dismissNotification(); }}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
      <div className="push-notification-progress" />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
        <SecurityProvider>
          <Router>
            <NotificationProvider>
            <ProtectedApp>
              <div className="min-h-screen">
                <ReloadPrompt />
                <ForegroundNotificationToast />
                <Routes>
                  {/* Landing Page at Root - Redirect to dashboard ONLY in PWA mode (if logged in) */}
                  <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                  
                  {/* Auth Route - Redirect to dashboard if already logged in (Always) */}
                  <Route path="/auth" element={<PublicRoute forceRedirect={true}><Auth /></PublicRoute>} />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                        <Footer />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/add"
                    element={
                      <PrivateRoute>
                        <AddEntry />
                        <Footer />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/sources"
                    element={
                      <PrivateRoute>
                        <Sources />
                        <Footer />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <PrivateRoute>
                        <Account />
                        <Footer />
                      </PrivateRoute>
                    }
                  />
                    <Route
                      path="/history"
                      element={
                        <PrivateRoute>
                          <History />
                          <Footer />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/stats"
                      element={
                        <PrivateRoute>
                          <Stats />
                          <Footer />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <PrivateRoute>
                          <Analytics />
                          <Footer />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/goals"
                      element={
                        <PrivateRoute>
                          <Goals />
                          <Footer />
                        </PrivateRoute>
                      }
                    />
                  <Route
                    path="/onboarding"
                    element={
                      <PrivateRoute>
                        <Onboarding />
                      </PrivateRoute>
                    }
                  />

                  {/* Fallback redirect */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </ProtectedApp>
            </NotificationProvider>
          </Router>
        </SecurityProvider>
      </AuthProvider>
      </SettingsProvider>
    </ThemeProvider >
  );
}

export default App;
