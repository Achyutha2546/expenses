import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/Transactions';
import Sources from './pages/Sources';
import Onboarding from './pages/Onboarding';
import History from './pages/History';
import Account from './pages/Account';
import Footer from './components/Footer';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                  <Footer />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/" />}
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
              path="/onboarding"
              element={
                <PrivateRoute>
                  <Onboarding />
                </PrivateRoute>
              }
            />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
