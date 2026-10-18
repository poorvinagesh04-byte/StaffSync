import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ManagersPage = lazy(() => import('./pages/ManagersPage'));
const LeavesPage = lazy(() => import('./pages/LeavesPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const AttendanceReportsPage = lazy(() => import('./pages/AttendanceReportsPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner fullScreen message="Loading page..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* HR Only Module */}
              <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
                <Route path="/managers" element={<ManagersPage />} />
              </Route>

              {/* HR & Manager Module */}
              <Route element={<ProtectedRoute allowedRoles={['HR', 'MANAGER']} />}>
                <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

