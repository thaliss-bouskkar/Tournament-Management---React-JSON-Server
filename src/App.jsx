import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
const PublicLayout = lazy(() => import('./layout/PublicLayout'));
const AdminLayout = lazy(() => import('./layout/AdminLayout'));
const ProtectedRoute = lazy(() => import('./layout/ProtectedRoute'));

// Public Pages
const Home = lazy(() => import('./pages/Home'));
const Stats = lazy(() => import('./pages/Stats'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Admin Pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const GroupsCRUD = lazy(() => import('./pages/admin/GroupsCRUD'));
const TeamsCRUD = lazy(() => import('./pages/admin/TeamsCRUD'));
const MatchesCRUD = lazy(() => import('./pages/admin/MatchesCRUD'));
const AdminStatistics = lazy(() => import('./pages/admin/AdminStatistics'));
const AdminsCRUD = lazy(() => import('./pages/admin/AdminsCRUD'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));

// Others
const NotFound = lazy(() => import('./pages/NotFound'));

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <Toaster position="top-right" />
            <Suspense fallback={<Loading />}>
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
            </Suspense>
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
