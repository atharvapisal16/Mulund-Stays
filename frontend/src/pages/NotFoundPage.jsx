import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-8xl mb-6">🏚️</div>
      <h1 className="text-4xl font-display font-bold text-dark-50 mb-3">Page Not Found</h1>
      <p className="text-dark-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/search" className="btn-secondary">Find Stays</Link>
      </div>
    </div>
  );
}
