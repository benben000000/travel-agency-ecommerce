'use client';
import { useState, useEffect, useRef } from 'react';

export default function LocationAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Where to? (e.g. Kyoto, Tromsø)',
  className = '',
  inputClassName = '',
}) {
  const [query, setQuery] = useState(value);
  const [locations, setLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch all locations on initial mount
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        if (data.locations) {
          setLocations(data.locations);
        }
      } catch (err) {}
    }
    loadLocations();
  }, []);

  // Filter suggestions when query or locations change
  useEffect(() => {
    if (!query.trim()) {
      // Show top popular locations when empty
      setSuggestions(locations.slice(0, 8));
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = locations.filter((loc) => {
      const cityMatch = loc.city?.toLowerCase().includes(q);
      const countryMatch = loc.country?.toLowerCase().includes(q);
      const labelMatch = loc.label?.toLowerCase().includes(q);
      return cityMatch || countryMatch || labelMatch;
    });

    setSuggestions(filtered.slice(0, 10));
    setSelectedIndex(-1);
  }, [query, locations]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) onChange(val);
  }

  function handleSelect(loc) {
    const selectedText = loc.city || loc.label;
    setQuery(selectedText);
    setIsOpen(false);
    if (onChange) onChange(selectedText);
    if (onSelect) onSelect(loc);
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
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
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

  return (
    <div ref={wrapperRef} className={`location-autocomplete-wrap ${className}`} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {isOpen && (
        <div className="location-suggestions-dropdown">
          <div className="location-dropdown-header">
            {query.trim() ? (
              <span>Matching Destinations ({suggestions.length})</span>
            ) : (
              <span>Popular Global Destinations</span>
            )}
          </div>

          {suggestions.length === 0 ? (
            <div className="location-no-match">
              <span>No matching tour destinations found for &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            <div className="location-suggestions-list">
              {suggestions.map((loc, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={`${loc.label}-${idx}`}
                    className={`location-suggestion-item ${isSelected ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(loc);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
