// AuthLayout.jsx
import { Outlet, Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg">
            Mulund<span className="text-brand-400">Stays</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
export default AuthLayout;
