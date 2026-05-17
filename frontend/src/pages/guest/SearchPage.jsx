import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { listingAPI } from '@/services/api';
import { ListingCard, ListingCardSkeleton, EmptyState } from '@/components/common/UI';
import { MULUND_AREAS, PROPERTY_TYPES } from '@/utils/helpers';

const AMENITY_FILTERS = [
  { key: 'wifi', label: '📶 WiFi' },
  { key: 'ac', label: '❄️ AC' },
  { key: 'kitchen', label: '🍳 Kitchen' },
  { key: 'parkingTwoWheeler', label: '🛵 Parking' },
  { key: 'petFriendly', label: '🐾 Pet Friendly' },
  { key: 'workDesk', label: '💼 Work Desk' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    area: searchParams.get('area') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '',
    type: '',
    minPrice: '',
    maxPrice: '',
    amenities: [],
    instantBook: false,
    minRating: '',
    sort: 'relevance',
  });

  const queryKey = ['listings-search', filters, page];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => {
      const params = { ...filters, page, limit: 12 };
      if (filters.amenities.length) params.amenities = filters.amenities.join(',');
      if (filters.instantBook) params.instantBook = 'true';
      return listingAPI.search(params);
    },
    keepPreviousData: true,
  });

  const listings = data?.data?.listings || [];
  const pagination = data?.data?.pagination;

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const toggleAmenity = (key) => {
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((a) => a !== key) : [...f.amenities, key],
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ area: '', checkIn: '', checkOut: '', guests: '', type: '', minPrice: '', maxPrice: '', amenities: [], instantBook: false, minRating: '', sort: 'relevance' });
    setPage(1);
  };

  const activeFilterCount = [filters.area, filters.type, filters.minPrice, filters.minRating, filters.instantBook]
    .filter(Boolean).length + filters.amenities.length;

  return (
    <div className="container-page py-8">
      {/* Top search bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <select
            value={filters.area}
            onChange={(e) => setFilter('area', e.target.value)}
            className="w-full pl-9 py-2.5 text-sm"
          >
            <option value="">All Areas</option>
            {MULUND_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <input type="date" value={filters.checkIn} onChange={(e) => setFilter('checkIn', e.target.value)}
          className="py-2.5 text-sm w-36" placeholder="Check-in" />
        <input type="date" value={filters.checkOut} onChange={(e) => setFilter('checkOut', e.target.value)}
          className="py-2.5 text-sm w-36" placeholder="Check-out" />
        <input type="number" value={filters.guests} onChange={(e) => setFilter('guests', e.target.value)}
          className="py-2.5 text-sm w-28" placeholder="Guests" min={1} />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary relative text-sm py-2.5 ${showFilters ? 'border-brand-500 text-brand-400' : ''}`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-dark-100">Advanced Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <X size={14} /> Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label>Property Type</label>
                  <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className="w-full text-sm py-2.5">
                    <option value="">Any</option>
                    {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label>Min Price (₹/night)</label>
                  <input type="number" placeholder="e.g. 500" value={filters.minPrice}
                    onChange={(e) => setFilter('minPrice', e.target.value)} className="w-full text-sm py-2.5" />
                </div>
                <div>
                  <label>Max Price (₹/night)</label>
                  <input type="number" placeholder="e.g. 3000" value={filters.maxPrice}
                    onChange={(e) => setFilter('maxPrice', e.target.value)} className="w-full text-sm py-2.5" />
                </div>
                <div>
                  <label>Min Rating</label>
                  <select value={filters.minRating} onChange={(e) => setFilter('minRating', e.target.value)} className="w-full text-sm py-2.5">
                    <option value="">Any</option>
                    <option value="4.5">4.5+</option>
                    <option value="4">4.0+</option>
                    <option value="3.5">3.5+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_FILTERS.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => toggleAmenity(a.key)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        filters.amenities.includes(a.key)
                          ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                          : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilter('instantBook', !filters.instantBook)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      filters.instantBook
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500'
                    }`}
                  >
                    ⚡ Instant Book
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-dark-400 text-sm">
          {isLoading ? 'Searching...' : `${pagination?.total || 0} stays found`}
          {filters.area && <span className="text-dark-200 ml-1">in {filters.area}</span>}
        </p>
        {isFetching && !isLoading && <span className="text-xs text-dark-500">Updating...</span>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No listings found"
          description="Try adjusting your filters or searching a different area."
          action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((l, i) => <ListingCard key={l._id} listing={l} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="btn-secondary disabled:opacity-40 px-4 py-2 text-sm">
            ← Prev
          </button>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-brand-500 text-white' : 'btn-secondary'}`}
            >
              {p}
            </button>
          ))}
          <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="btn-secondary disabled:opacity-40 px-4 py-2 text-sm">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
