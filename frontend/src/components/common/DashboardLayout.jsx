import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  BarChart3, BookOpen, ChevronLeft, ChevronRight,
  Home, LayoutDashboard, List, LogOut, Settings,
  Shield, Users, Wallet,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useAuthStore } from '@/context/authStore';
import Navbar from './Navbar';

const HOST_NAV = [
  { to: '/host', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/host/listings', label: 'My Listings', icon: Home },
  { to: '/host/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/host/earnings', label: 'Earnings', icon: Wallet },
  { to: '/host/kyc', label: 'KYC & Docs', icon: Shield },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/reviews', label: 'Review Queue', icon: Shield },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/listings', label: 'Listings', icon: List },
  { to: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/admin/revenue', label: 'Revenue', icon: BarChart3 },
];

export default function DashboardLayout({ role = 'host' }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuthStore();
  const nav = role === 'admin' ? ADMIN_NAV : HOST_NAV;

  // Security: Verify user has required role
  const isAdmin = role === 'admin';
  const isAdminUser = user?.role === 'admin';
  
  if (isAdmin && !isAdminUser) {
    console.error('🔒 SECURITY: Non-admin user attempted to access admin panel');
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-2">❌ Access Denied</h1>
          <p className="text-dark-400 mb-6">Only administrators can access this area.</p>
          <a href="/" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={cn(
          'hidden md:flex flex-col bg-dark-950 border-r border-dark-700/50 transition-all duration-300 sticky top-16 h-[calc(100vh-4rem)]',
          collapsed ? 'w-16' : 'w-60'
        )}>
          {/* Role badge */}
          {!collapsed && (
            <div className="p-4 border-b border-dark-700/50">
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                {role === 'admin' ? '⚡ Admin Panel' : '🏠 Host Dashboard'}
              </p>
              <p className="text-sm text-dark-200 mt-0.5 truncate">{user?.fullName}</p>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800',
                  collapsed && 'justify-center'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-2 border-t border-dark-700/50 space-y-0.5">
            {!collapsed && (
              <Link to="/" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-400 hover:text-dark-50 hover:bg-dark-800 transition-all')}>
                <Home size={18} />
                <span>Back to Site</span>
              </Link>
            )}
            <button
              onClick={logout}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all', collapsed && 'justify-center')}
            >
              <LogOut size={18} />
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 bg-dark-700 border border-dark-600 rounded-full flex items-center justify-center hover:bg-dark-600 transition-colors"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-dark-900">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
