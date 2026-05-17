import { Heart, MapPin, Star, Users, Bed, Bath, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn, formatCurrency, formatRating, PROPERTY_TYPES, truncate } from '@/utils/helpers';
import { useAuthStore } from '@/context/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '@/services/api';
import toast from 'react-hot-toast';

// ── Listing Card ──────────────────────────────────────
export function ListingCard({ listing, index = 0 }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [wishlisted, setWishlisted] = useState(false);

  const { mutate: toggleWishlist } = useMutation({
    mutationFn: () => userAPI.toggleWishlist(listing._id),
    onSuccess: (data) => {
      setWishlisted(data.data?.wishlisted);
      toast.success(data.data?.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
      queryClient.invalidateQueries(['wishlist']);
    },
  });

  const cover = listing.coverPhoto || listing.photos?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="card-hover group"
    >
      <Link to={`/listings/${listing._id}`} className="block">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={cover}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {listing.isFeatured && (
            <span className="absolute top-3 left-3 badge-brand text-xs">✨ Featured</span>
          )}
          {listing.availability?.instantBook && (
            <span className="absolute top-3 left-3 badge bg-amber-500/90 text-amber-900 border-0 text-xs">
              <Zap size={10} className="fill-current" /> Instant Book
            </span>
          )}
          {listing.ratings?.totalReviews > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-xs text-white font-semibold">{formatRating(listing.ratings.average)}</span>
              <span className="text-xs text-white/70">({listing.ratings.totalReviews})</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-dark-50 text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
              {listing.title}
            </h3>
            {isAuthenticated && (
              <button
                onClick={(e) => { e.preventDefault(); toggleWishlist(); }}
                className={cn('flex-shrink-0 p-1.5 rounded-lg transition-all hover:bg-dark-700', wishlisted ? 'text-brand-500' : 'text-dark-400 hover:text-brand-400')}
              >
                <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-dark-400 text-xs mb-3">
            <MapPin size={11} />
            <span>{listing.location?.area || 'Mulund'}</span>
            <span className="mx-1">·</span>
            <span className="text-dark-500">{PROPERTY_TYPES[listing.propertyType] || listing.propertyType}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-dark-400 mb-3">
            <span className="flex items-center gap-1"><Users size={11} /> {listing.capacity?.maxGuests} guests</span>
            <span className="flex items-center gap-1"><Bed size={11} /> {listing.capacity?.bedrooms} bed</span>
            <span className="flex items-center gap-1"><Bath size={11} /> {listing.capacity?.bathrooms} bath</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-lg font-bold text-dark-50">{formatCurrency(listing.pricing?.basePrice)}</span>
              <span className="text-xs text-dark-400 ml-1">/ night</span>
            </div>
            {listing.host?.hostStats?.isSuperhost && (
              <span className="badge-brand text-[10px]">⭐ Superhost</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Star Rating ───────────────────────────────────────
export function StarRating({ rating, count, size = 14, showCount = true }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-dark-600'}
        />
      ))}
      {showCount && <span className="text-xs text-dark-400 ml-1">({count || 0})</span>}
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────
export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="h-5 skeleton rounded w-1/4" />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-dark-100 mb-2">{title}</h3>
      <p className="text-dark-400 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

// ── Stat Card (for dashboards) ────────────────────────
export function StatCard({ label, value, icon, trend, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center text-lg', colorMap[color])}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-semibold', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-dark-50 font-display">{value}</p>
      <p className="text-sm text-dark-400 mt-1">{label}</p>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────
export function Badge({ children, variant = 'neutral' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ── Page Header ───────────────────────────────────────
export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div className="mb-8">
      {back && <div className="mb-3">{back}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-50">{title}</h1>
          {subtitle && <p className="text-dark-400 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={cn('border-2 border-dark-600 border-t-brand-500 rounded-full animate-spin', s)} />
  );
}

// ── Full page loader ──────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-dark-400 text-sm mt-3">Loading...</p>
      </div>
    </div>
  );
}

// ── Amenity chip ──────────────────────────────────────
export function AmenityChip({ icon, label, active = true }) {
  return (
    <div className={cn('amenity-chip', !active && 'opacity-40 line-through')}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Form error ────────────────────────────────────────
export function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-400 mt-1 flex items-center gap-1">⚠ {message}</p>;
}
