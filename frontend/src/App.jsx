import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UploadProof from './pages/auth/UploadProof';
import ForgotPassword from './pages/auth/ForgotPassword';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import NeighborhoodDetail from './pages/neighborhoods/NeighborhoodDetail';
import CreateNeighborhood from './pages/neighborhoods/CreateNeighborhood';
import MessagesPage from './pages/messages/MessagesPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminPanel from './pages/admin/AdminPanel';
import SuperAdminPanel from './pages/admin/SuperAdminPanel';
import MembersPage from './pages/MembersPage';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/upload-proof" element={<ProtectedRoute><UploadProof /></ProtectedRoute>} />

      {/* Protected - with layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/neighborhoods/create" element={<CreateNeighborhood />} />
        <Route path="/neighborhoods/:id" element={<NeighborhoodDetail />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/super-admin" element={<SuperAdminPanel />} />
        <Route path="/settings" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
