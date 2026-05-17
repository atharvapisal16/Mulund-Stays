import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/context/authStore';

// Layouts
import MainLayout from '@/components/common/MainLayout';
import AuthLayout from '@/components/common/AuthLayout';
import DashboardLayout from '@/components/common/DashboardLayout';

// Public pages
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/guest/SearchPage';
import ListingDetailPage from '@/pages/guest/ListingDetailPage';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyOTPPage from '@/pages/auth/VerifyOTPPage';

// Guest pages
import GuestBookingsPage from '@/pages/guest/GuestBookingsPage';
import BookingDetailPage from '@/pages/guest/BookingDetailPage';
import BookingCheckoutPage from '@/pages/guest/BookingCheckoutPage';
import WishlistPage from '@/pages/guest/WishlistPage';

// Host pages
import BecomeHostPage from '@/pages/BecomeHostPage';
import HostDashboardPage from '@/pages/host/HostDashboardPage';
import HostListingsPage from '@/pages/host/HostListingsPage';
import CreateListingPage from '@/pages/host/CreateListingPage';
import EditListingPage from '@/pages/host/EditListingPage';
import HostBookingsPage from '@/pages/host/HostBookingsPage';
import HostEarningsPage from '@/pages/host/HostEarningsPage';
import KYCPage from '@/pages/host/KYCPage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminListingsPage from '@/pages/admin/AdminListingsPage';
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage';
import AdminReviewQueuePage from '@/pages/admin/AdminReviewQueuePage';

// Common
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Guards
const ProtectedRoute = ({ children, roles, fallbackPath = '/' }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Explicit role validation
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(user?.role);
    const isHost = roles.includes('host') && user?.isHost === true;
    
    if (!hasRole && !isHost) {
      console.warn(`❌ Access Denied: User role '${user?.role}' not in allowed roles [${roles.join(', ')}]`);
      return <Navigate to={fallbackPath} replace />;
    }
  }
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default function App({ adminOnly = false }) {
  if (adminOnly) {
    return (
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage adminOnly={true} />} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/verify-otp" element={<ProtectedRoute><VerifyOTPPage /></ProtectedRoute>} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']} fallbackPath="/login">
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="reviews" element={<AdminReviewQueuePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* ── Public ─────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Auth ───────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/verify-otp" element={<ProtectedRoute><VerifyOTPPage /></ProtectedRoute>} />
      </Route>

      {/* ── Guest ──────────────────────────────────── */}
      <Route path="/become-host" element={<ProtectedRoute><BecomeHostPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<GuestBookingsPage />} />
        <Route path=":id" element={<BookingDetailPage />} />
        <Route path=":id/checkout" element={<BookingCheckoutPage />} />
      </Route>
      <Route path="/wishlist" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<WishlistPage />} />
      </Route>

      {/* ── Host ───────────────────────────────────── */}
      <Route path="/host" element={
        <ProtectedRoute roles={['host', 'admin']}>
          <DashboardLayout role="host" />
        </ProtectedRoute>
      }>
        <Route index element={<HostDashboardPage />} />
        <Route path="listings" element={<HostListingsPage />} />
        <Route path="listings/new" element={<CreateListingPage />} />
        <Route path="listings/:id/edit" element={<EditListingPage />} />
        <Route path="bookings" element={<HostBookingsPage />} />
        <Route path="earnings" element={<HostEarningsPage />} />
        <Route path="kyc" element={<KYCPage />} />
      </Route>

      {/* ── Admin ──────────────────────────────────── */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']} fallbackPath="/login">
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="reviews" element={<AdminReviewQueuePage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="listings" element={<AdminListingsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
      </Route>
    </Routes>
  );
}
