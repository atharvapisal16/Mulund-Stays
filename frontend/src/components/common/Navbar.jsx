import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Heart, Home, LayoutDashboard, LogOut, Menu, Settings, Shield, User, X } from 'lucide-react';
import { useAuthStore } from '@/context/authStore';
import { cn } from '@/utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { notificationAPI } from '@/services/api';

export default function Navbar() {
  const { isAuthenticated, user, logout, isHost, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: notificationAPI.getAll,
    enabled: isAuthenticated,
    refetchInterval: 30000,
    select: (d) => d?.data?.unreadCount || 0,
  });

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <Home size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-dark-50">
              Mulund<span className="text-brand-400">Stays</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/search" className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
              Find Stays
            </NavLink>
            {isAuthenticated && !isHost() && !isAdmin() && (
              <button onClick={() => navigate('/become-host')} className="nav-link">
                Become a Host
              </button>
            )}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-dark-300 hover:text-dark-50 hover:bg-dark-800 rounded-lg transition-all">
                  <Bell size={20} />
                  {notifData > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notifData > 9 ? '9+' : notifData}
                    </span>
                  )}
                </Link>

                {/* Wishlist */}
                <Link to="/wishlist" className="hidden sm:flex p-2 text-dark-300 hover:text-brand-400 hover:bg-dark-800 rounded-lg transition-all">
                  <Heart size={20} />
                </Link>

                {/* User menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-xl transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center overflow-hidden">
                      {user?.profilePhoto?.url
                        ? <img src={user.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-brand-400">{user?.fullName?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-dark-100 max-w-[100px] truncate">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className={cn('text-dark-400 transition-transform', menuOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 card border border-dark-600 shadow-2xl"
                      >
                        <div className="p-3 border-b border-dark-700">
                          <p className="text-sm font-semibold text-dark-50">{user?.fullName}</p>
                          <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                          <MenuItem icon={User} label="My Profile" to="/profile/me" onClick={() => setMenuOpen(false)} />
                          <MenuItem icon={Heart} label="Wishlist" to="/wishlist" onClick={() => setMenuOpen(false)} />
                          <MenuItem icon={LayoutDashboard} label="My Bookings" to="/bookings" onClick={() => setMenuOpen(false)} />
                          {(isHost() || isAdmin()) && (
                            <>
                              <div className="h-px bg-dark-700 my-1" />
                              <MenuItem icon={Home} label="Host Dashboard" to="/host" onClick={() => setMenuOpen(false)} />
                            </>
                          )}
                          {isAdmin() && (
                            <MenuItem icon={Shield} label="Admin Panel" to="/admin" onClick={() => setMenuOpen(false)} />
                          )}
                          <div className="h-px bg-dark-700 my-1" />
                          <MenuItem icon={Settings} label="Settings" to="/profile/me" onClick={() => setMenuOpen(false)} />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <LogOut size={15} />
                            Log Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Log In</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-dark-300 hover:text-dark-50 hover:bg-dark-800 rounded-lg"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-dark-700/50 py-3 space-y-1"
            >
              <NavLink to="/search" className="block nav-link" onClick={() => setMobileOpen(false)}>Find Stays</NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/bookings" className="block nav-link" onClick={() => setMobileOpen(false)}>My Bookings</NavLink>
                  <NavLink to="/wishlist" className="block nav-link" onClick={() => setMobileOpen(false)}>Wishlist</NavLink>
                  {(isHost() || isAdmin()) && (
                    <NavLink to="/host" className="block nav-link" onClick={() => setMobileOpen(false)}>Host Dashboard</NavLink>
                  )}
                  {isAdmin() && (
                    <NavLink to="/admin" className="block nav-link" onClick={() => setMobileOpen(false)}>Admin Panel</NavLink>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left nav-link text-red-400">Log Out</button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, label, to, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 px-3 py-2 text-sm text-dark-200 hover:text-dark-50 hover:bg-dark-800 rounded-lg transition-colors">
      <Icon size={15} className="text-dark-400" />
      {label}
    </Link>
  );
}
