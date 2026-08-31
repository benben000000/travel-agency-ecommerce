'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LocationAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Where to? (e.g. Kyoto, Safari, Swiss Alps)',
  className = '',
  inputClassName = '',
}) {
  const router = useRouter();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState({ packages: [], destinations: [], categories: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flatItems, setFlatItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch search recommendations (with debounce)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const qParam = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
        const res = await fetch(`/api/locations${qParam}`);
        const data = await res.json();
        
        const packages = data.packages || [];
        const destinations = data.destinations || [];
        const categories = data.categories || [];

        setResults({ packages, destinations, categories });

        // Flatten items for unified keyboard arrow navigation
        const flattened = [
          ...packages.map((p) => ({ ...p, itemType: 'package' })),
          ...destinations.map((d) => ({ ...d, itemType: 'destination' })),
          ...categories.map((c) => ({ ...c, itemType: 'category' })),
        ];
        setFlatItems(flattened);
        setSelectedIndex(-1);
      } catch (err) {}
      setLoading(false);
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) onChange(val);
  }

  function handleSelectItem(item) {
    setIsOpen(false);
    if (item.itemType === 'package' || item.type === 'package') {
      if (item.slug) {
        router.push(`/packages/${item.slug}`);
      } else {
        setQuery(item.title);
        if (onChange) onChange(item.title);
      }
    } else if (item.itemType === 'destination' || item.type === 'destination') {
      const selectedText = item.city || item.label;
      setQuery(selectedText);
      if (onChange) onChange(selectedText);
      if (onSelect) onSelect(item);
    } else if (item.itemType === 'category' || item.type === 'category') {
      setQuery(item.name);
      if (onChange) onChange(item.name);
      if (onSelect) onSelect(item);
    }
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        e.preventDefault();
        handleSelectItem(flatItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function highlightMatch(text, matchQuery) {
    if (!matchQuery.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${matchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === matchQuery.toLowerCase() ? (
        <strong key={i} style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
          {part}
        </strong>
      ) : (
        part
      )
    );
  }

  const hasResults =
    results.packages.length > 0 ||
    results.destinations.length > 0 ||
    results.categories.length > 0;

  return (
    <div
      ref={wrapperRef}
      className={`location-autocomplete-wrap ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      <input
        ref={inputRef}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        style={{ width: '100%', cursor: 'text' }}
      />

      {isOpen && (
        <div
          className="location-suggestions-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            width: '100%',
            minWidth: '100%',
            zIndex: 9999,
          }}
        >
          {loading && !hasResults ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Searching listings & destinations...
            </div>
          ) : !hasResults ? (
            <div className="location-no-match">
              <span>No matching travel listings or destinations found for &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            <div className="location-suggestions-list">
              {/* ===== SECTION 1: MATCHING PACKAGES ===== */}
              {results.packages.length > 0 && (
                <div>
                  <div className="location-dropdown-header">
                    <span>{query.trim() ? 'Matching Package Listings' : 'Featured Travel Packages'}</span>
                  </div>
                  {results.packages.map((pkg) => (
                    <div
                      key={`pkg-${pkg.id}`}
                      className="location-suggestion-item package-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectItem({ ...pkg, itemType: 'package' });
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectItem({ ...pkg, itemType: 'package' });
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="loc-thumb-box">
                        <img src={pkg.thumbnail} alt={pkg.title} onError={(e) => { e.target.src = '/images/placeholder-travel.jpg'; }} />
                      </div>

                      <div className="loc-details">
                        <div className="loc-city" style={{ fontSize: '0.88rem', fontWeight: '600' }}>
                          {highlightMatch(pkg.title, query)}
                        </div>
                        <div className="loc-country" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{pkg.destination}</span>
                          {pkg.duration && <span>&bull; {pkg.duration} Days</span>}
                        </div>
                      </div>

                      {pkg.price && pkg.price !== '0' && (
                        <div className="loc-badge price-badge">
                          ${pkg.price}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ===== SECTION 2: DESTINATIONS ===== */}
              {results.destinations.length > 0 && (
                <div>
                  <div className="location-dropdown-header">
                    <span>Destinations & Regions</span>
                  </div>
                  {results.destinations.map((loc, idx) => (
                    <div
                      key={`dest-${loc.label}-${idx}`}
                      className="location-suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectItem({ ...loc, itemType: 'destination' });
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectItem({ ...loc, itemType: 'destination' });
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="loc-icon-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>

                      <div className="loc-details">
                        <div className="loc-city">
                          {highlightMatch(loc.city || loc.label, query)}
                        </div>
                        {loc.country && (
                          <div className="loc-country">
                            {loc.country}
                          </div>
                        )}
                      </div>

                      {loc.package_count && (
                        <div className="loc-badge">
                          {loc.package_count} {loc.package_count === 1 ? 'tour' : 'tours'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ===== SECTION 3: CATEGORIES & ACTIVITIES ===== */}
              {results.categories.length > 0 && (
                <div>
                  <div className="location-dropdown-header">
                    <span>Travel Styles & Activities</span>
                  </div>
                  {results.categories.map((cat) => (
                    <div
                      key={`cat-${cat.slug}`}
                      className="location-suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectItem({ ...cat, itemType: 'category' });
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectItem({ ...cat, itemType: 'category' });
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="loc-icon-badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                          <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                      </div>

                      <div className="loc-details">
                        <div className="loc-city">
                          {highlightMatch(cat.name, query)}
                        </div>
                        <div className="loc-country">
                          {cat.categoryType === 'activity' ? 'Activity Experience' : 'Travel Category'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
