import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import PublicLayout from './layout/PublicLayout';
import AdminLayout from './layout/AdminLayout';
import ProtectedRoute from './layout/ProtectedRoute';
import Home from './pages/Home';
import Stats from './pages/Stats';
import Login from './pages/Login';
import GroupsCRUD from './pages/admin/GroupsCRUD';
import TeamsCRUD from './pages/admin/TeamsCRUD';
import AdminProfile from './pages/admin/AdminProfile';
import ResetPassword from './pages/ResetPassword';
import Calendar from './pages/Calendar';
import Dashboard from './pages/admin/Dashboard';
import AdminStatistics from './pages/admin/AdminStatistics';
import AdminsCRUD from './pages/admin/AdminsCRUD';
import MatchesCRUD from './pages/admin/MatchesCRUD';
import NotFound from './pages/NotFound';

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/resetpassword/:token" element={<ResetPassword />} />
              </Route>

              {/* Admin Routes - Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="groups" element={<GroupsCRUD />} />
                  <Route path="teams" element={<TeamsCRUD />} />
                  <Route path="matches" element={<MatchesCRUD />} />
                  <Route path="statistics" element={<AdminStatistics />} />
                  <Route path="admins" element={<AdminsCRUD />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>
              </Route>

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
