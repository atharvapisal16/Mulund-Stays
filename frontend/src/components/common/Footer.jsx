import { Link } from 'react-router-dom';
import { Home, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-950 border-t border-dark-700/50 mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Home size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg">
                Mulund<span className="text-brand-400">Stays</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed">
              Find verified short-stay accommodations in Mulund East & West, Mumbai. Trusted by hosts and guests since 2024.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center text-dark-400 hover:text-brand-400 hover:bg-dark-700 transition-all">
                <Instagram size={14} />
              </a>
              <a href="#" className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center text-dark-400 hover:text-brand-400 hover:bg-dark-700 transition-all">
                <Twitter size={14} />
              </a>
            </div>
          </div>

          <FooterCol title="Explore" links={[
            { label: 'Find Stays', to: '/search' },
            { label: 'Mulund East', to: '/search?area=Mulund+East' },
            { label: 'Mulund West', to: '/search?area=Mulund+West' },
            { label: 'Near Station', to: '/search?tags=near_station' },
          ]} />

          <FooterCol title="Hosting" links={[
            { label: 'Become a Host', to: '/register' },
            { label: 'Host Dashboard', to: '/host' },
            { label: 'KYC Verification', to: '/host/kyc' },
            { label: 'Host Earnings', to: '/host/earnings' },
          ]} />

          <FooterCol title="Company" links={[
            { label: 'About Us', to: '/' },
            { label: 'Safety', to: '/' },
            { label: 'Privacy Policy', to: '/' },
            { label: 'Terms of Service', to: '/' },
          ]} />
        </div>

        <div className="divider" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark-500">
          <p>© {new Date().getFullYear()} MulundStays. All rights reserved.</p>
          <p>Made with ❤️ for Mulund, Mumbai</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-dark-100 mb-3 uppercase tracking-wider">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-dark-400 hover:text-brand-400 transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
