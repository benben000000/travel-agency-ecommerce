'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PackageCard from '@/components/PackageCard';
import LocationAutocomplete from '@/components/LocationAutocomplete';

function PackagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    destination: searchParams.get('destination') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    duration: searchParams.get('duration') || '',
    sort: searchParams.get('sort') || 'featured',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [searchParams]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {}
  }

  async function fetchPackages() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      searchParams.forEach((v, k) => params.set(k, v));
      const res = await fetch(`/api/packages?${params.toString()}`);
      const data = await res.json();
      setPackages(data.packages || []);
      setPagination(data.pagination || {});
    } catch (err) {}
    setLoading(false);
  }

  function applyFilters(e) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.duration) params.set('duration', filters.duration);
    if (filters.sort) params.set('sort', filters.sort);
    router.push(`/packages?${params.toString()}`);
  }

  function handleSortChange(newSort) {
    setFilters((prev) => {
      const next = { ...prev, sort: newSort };
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', newSort);
      router.push(`/packages?${params.toString()}`);
      return next;
    });
  }

  function clearFilters() {
    setFilters({ search: '', category: '', destination: '', minPrice: '', maxPrice: '', duration: '', sort: 'featured' });
    router.push('/packages');
  }

  const destinations = categories.filter((c) => c.type === 'destination');
  const activities = categories.filter((c) => c.type === 'activity');

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>Explore Travel Packages</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
              Handpicked itineraries curated by certified tour operators worldwide.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
              SORT BY:
            </span>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '180px', padding: '8px 12px' }}
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="featured">Featured & Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration_asc">Duration: Shortest</option>
              <option value="duration_desc">Duration: Longest</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Departures</option>
            </select>
          </div>
        </div>

        <form className="filters-bar" onSubmit={applyFilters}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <LocationAutocomplete
              value={filters.search}
              onChange={(val) => setFilters({ ...filters, search: val })}
              onSelect={(loc) => {
                const term = loc.city || loc.label;
                setFilters({ ...filters, search: term });
                const params = new URLSearchParams(searchParams.toString());
                params.set('search', term);
                router.push(`/packages?${params.toString()}`);
              }}
              placeholder="Search destination, keywords..."
              inputClassName="form-input"
            />
          </div>
          <select
            className="form-select"
            value={filters.destination}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
          >
            <option value="">All Regions</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Activity Styles</option>
            {activities.map((a) => (
              <option key={a.id} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="form-input"
            placeholder="Min $"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            style={{ width: '90px' }}
          />
          <input
            type="number"
            className="form-input"
            placeholder="Max $"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            style={{ width: '90px' }}
          />
          <select
            className="form-select"
            value={filters.duration}
            onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
          >
            <option value="">Any Duration</option>
            <option value="1-5">Short (1 - 5 Days)</option>
            <option value="6-8">Standard (6 - 8 Days)</option>
            <option value="9-14">Extended (9 - 14 Days)</option>
            <option value="15+">Grand (15+ Days)</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary btn-sm">
              Filter
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </form>

        {loading ? (
          <div className="loading-page">
            <div className="loading-spinner"></div>
          </div>
        ) : packages.length > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Showing {packages.length} of {pagination.total} travel package{pagination.total !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="packages-grid">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={pagination.page === i + 1 ? 'active' : ''}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', i + 1);
                      router.push(`/packages?${params.toString()}`);
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <h3>No Travel Packages Found</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              No listings match your search criteria. Try clearing some filters.
            </p>
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="loading-spinner"></div></div>}>
      <PackagesContent />
    </Suspense>
  );
}
