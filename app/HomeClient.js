'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PackageCard from '@/components/PackageCard';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import HeroVideo from '@/components/HeroVideo';

export default function HomeClient({ packages, destinations, activities, settings }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('packages');
  const [storyTab, setStoryTab] = useState('travel');
  const [searchPlace, setSearchPlace] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [travelers, setTravelers] = useState('2');

  const storyContent = {
    travel: {
      title: 'Our Story: Driven By Wanderlust, Powered By Experience',
      highlight: 'We Believe That Travel Is More Than Just Visiting A New Place - It Is About Creating Lasting Memories',
      description: 'We are committed to providing exceptional service and making every journey seamless and memorable. Join us and let us turn your travel aspirations into reality.',
      buttonText: 'Learn More About Us',
      buttonLink: '/about',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
          alt: 'Tropical island bay',
          large: true,
        },
        {
          src: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=600&q=80',
          alt: 'Nordic aurora borealis',
        },
        {
          src: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
          alt: 'Kyoto pagoda garden',
        },
      ],
    },
    tourism: {
      title: 'Sustainable Tourism: Empowering Local Communities Worldwide',
      highlight: 'Preserving Natural Wonders & Supporting Authentic Indigenous Culture Across Every Continent',
      description: 'Every journey booked through Global One Travel directly supports verified local guides, wildlife conservation initiatives, and heritage artisans in over 40 countries.',
      buttonText: 'Explore Responsible Travel',
      buttonLink: '/packages',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
          alt: 'Serengeti safari wildlife',
          large: true,
        },
        {
          src: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=600&q=80',
          alt: 'Machu Picchu peaks',
        },
        {
          src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
          alt: 'Amalfi Coast catamaran',
        },
      ],
    },
    'best-places': {
      title: 'Curated Expeditions: The World Most Iconic Destinations',
      highlight: 'From Arctic Glass Igloos to Ancient Silk Road Minarets and Polynesian Atolls',
      description: 'Discover extraordinary bucket-list itineraries thoroughly vetted for safety, luxury comfort, and peerless local expertise by certified tour operators.',
      buttonText: 'View Top Rated Places',
      buttonLink: '/packages?sort=rating',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
          alt: 'Norwegian fjord cliffs',
          large: true,
        },
        {
          src: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80',
          alt: 'Petra Treasury candlelit',
        },
        {
          src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
          alt: 'Bora Bora overwater villas',
        },
      ],
    },
  };

  const placeholderText =
    activeTab === 'destinations'
      ? 'Search destination or country (e.g. Japan, Norway, Italy)'
      : activeTab === 'guides'
      ? 'Search guided tours (e.g. Safari, Glacier, Catamaran)'
      : activeTab === 'custom'
      ? 'Where would you like your custom itinerary?'
      : 'Where to? (e.g. Kyoto, Tromsø)';

  const labelText =
    activeTab === 'destinations'
      ? 'Select Destination'
      : activeTab === 'guides'
      ? 'Select Tour Activity'
      : activeTab === 'custom'
      ? 'Custom Destination'
      : 'Select Tour Place';

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (activeTab === 'custom') {
      router.push(`/contact?subject=Custom+Itinerary+Request&destination=${encodeURIComponent(searchPlace)}`);
      return;
    }
    const params = new URLSearchParams();
    if (searchPlace.trim()) params.set('search', searchPlace.trim());
    if (travelers) params.set('guests', travelers);
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    router.push(`/packages?${params.toString()}`);
  }

  return (
    <main>
      {/* ===== VIBRANT HERO SECTION WITH BACKGROUND VIDEO ===== */}
      <div className="container hero-wrapper">
        <HeroVideo />

        {/* ===== FLOATING INTERACTIVE SEARCH CARD ===== */}
        <div className="floating-search-card">
          <div className="search-tabs">
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'packages' ? 'active' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              Tour Packages
            </button>
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'destinations' ? 'active' : ''}`}
              onClick={() => setActiveTab('destinations')}
            >
              Destinations
            </button>
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'guides' ? 'active' : ''}`}
              onClick={() => setActiveTab('guides')}
            >
              Tours & Guides
            </button>
            <button
              type="button"
              className={`search-tab-pill ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              Custom Itineraries
            </button>
          </div>

          <form className="search-form-row" onSubmit={handleSearchSubmit}>
            <div className="search-field" style={{ position: 'relative' }}>
              <label>{labelText}</label>
              <div className="search-input-box" style={{ position: 'relative' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <LocationAutocomplete
                  value={searchPlace}
                  onChange={(val) => setSearchPlace(val)}
                  onSelect={(loc) => setSearchPlace(loc.city || loc.label)}
                  placeholder={placeholderText}
                />
              </div>
            </div>

            <div className="search-field">
              <label>Check In</label>
              <div className="search-input-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
            </div>

            <div className="search-field">
              <label>Check Out</label>
              <div className="search-input-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="search-field">
              <label>Travelers</label>
              <div className="search-input-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <select value={travelers} onChange={(e) => setTravelers(e.target.value)}>
                  <option value="1">1 Traveler (Solo)</option>
                  <option value="2">2 Travelers (Couple)</option>
                  <option value="4">4 Travelers (Small Group)</option>
                  <option value="8">8+ Travelers (Large Group)</option>
                </select>
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ height: '48px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Search Packages
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== FEATURED PACKAGES SECTION ===== */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <span className="section-tag">Featured Expeditions</span>
            <h2>Top Recommended Packages</h2>
            <p>Handpicked travel journeys curated and managed by our certified tour operators</p>
          </div>
          {packages.length > 0 ? (
            <>
              <div className="packages-grid">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <Link href="/packages" className="btn btn-secondary btn-lg">
                  View All Travel Packages
                </Link>
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <h3>No travel packages published yet</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>Explore upcoming departures as tour operators add their listings.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== STORY / ABOUT SECTION ===== */}
      <section className="section" style={{ background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="story-grid">
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`search-tab-pill ${storyTab === 'travel' ? 'active' : ''}`}
                  onClick={() => setStoryTab('travel')}
                  style={{ cursor: 'pointer' }}
                >
                  Travel
                </button>
                <button
                  type="button"
                  className={`search-tab-pill ${storyTab === 'tourism' ? 'active' : ''}`}
                  onClick={() => setStoryTab('tourism')}
                  style={{ cursor: 'pointer' }}
                >
                  Tourism
                </button>
                <button
                  type="button"
                  className={`search-tab-pill ${storyTab === 'best-places' ? 'active' : ''}`}
                  onClick={() => setStoryTab('best-places')}
                  style={{ cursor: 'pointer' }}
                >
                  Best Places
                </button>
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: '1.2' }}>
                {storyContent[storyTab]?.title}
              </h2>
              <div style={{ padding: '20px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-primary)' }}>
                  {storyContent[storyTab]?.highlight}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                  {storyContent[storyTab]?.description}
                </p>
              </div>
              <Link href={storyContent[storyTab]?.buttonLink || '/about'} className="btn btn-primary btn-lg">
                {storyContent[storyTab]?.buttonText || 'Learn More'}
              </Link>
            </div>

            <div className="story-mosaic">
              {storyContent[storyTab]?.images.map((img, i) => (
                <div key={i} className={img.large ? 'story-mosaic-item-large' : 'story-mosaic-item'}>
                  <img src={img.src} alt={img.alt} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS - 4 NUMBERED STEPS ===== */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <span className="section-tag">Simple & Seamless</span>
            <h2>How It Works</h2>
            <p>From finding inspiration to returning with unforgettable stories, here is how our marketplace works</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">01</div>
              <h3>Choose Your Destination</h3>
              <p>Browse our selection of incredible locations and find the perfect trip that suits your interests and schedule.</p>
            </div>

            <div className="step-card">
              <div className="step-num">02</div>
              <h3>Book Your Trip</h3>
              <p>Easily select your preferred dates, apply promo codes, and complete your reservation through our secure online system.</p>
            </div>

            <div className="step-card">
              <div className="step-num">03</div>
              <h3>Get Ready For Adventure</h3>
              <p>Receive detailed day-by-day itineraries, packing tips, meeting point guides, and direct chat access to your tour agent.</p>
            </div>

            <div className="step-card">
              <div className="step-num">04</div>
              <h3>Enjoy Your Experience</h3>
              <p>Meet your guides on site, explore breathtaking wonders, and create lifetime memories with expertly organized tours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRAVELER STORIES & REVIEWS ===== */}
      <section className="section" style={{ background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-title">
            <span className="section-tag">Community Feedback</span>
            <h2>Traveler Stories & Reviews</h2>
            <p>Read authentic experiences shared by travelers who booked their adventures through Global One Travel</p>
          </div>

          <div className="testimonials-grid">
            <div className="story-card">
              <div className="story-card-header">
                <div className="story-avatar">LT</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Lisa Chen & Family</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Cultural Explorer</div>
                </div>
              </div>
              <div className="story-card-title">A Seamless Family Vacation!</div>
              <div className="story-card-body">
                "Thanks to our operator, our family journey to Kyoto was stress-free and packed with unforgettable moments. From private tea masters to ryokan onsens, everything was handled with perfection."
              </div>
              <div className="story-card-footer">
                <span>Kyoto Zen Temples & Culinary Arts</span>
                <span>Verified Trip</span>
              </div>
            </div>

            <div className="story-card">
              <div className="story-card-header">
                <div className="story-avatar">ST</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Sophia & Liam Turner</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Arctic Adventurers</div>
                </div>
              </div>
              <div className="story-card-title">Aurora Borealis of a Lifetime</div>
              <div className="story-card-body">
                "We spotted the Northern Lights on day 3 from our glass igloo! Elena and her team went above and beyond with thermal suits, husky sledding, and authentic Sami cultural fires."
              </div>
              <div className="story-card-footer">
                <span>Northern Lights & Fjord Expedition</span>
                <span>Verified Trip</span>
              </div>
            </div>

            <div className="story-card">
              <div className="story-card-header">
                <div className="story-avatar">BG</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Benedict Garcia</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Solo Explorer</div>
                </div>
              </div>
              <div className="story-card-title">Outstanding Local Operator Support</div>
              <div className="story-card-body">
                "The built-in chat allowed me to coordinate arrival details with our guide before landing. Truly modern, transparent, and hassle-free booking experience!"
              </div>
              <div className="story-card-footer">
                <span>Kyoto & Nordic Expeditions</span>
                <span>Verified Trip</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA WITH DESTINATION MOSAIC STRIP ===== */}
      <div className="container" style={{ padding: '60px 24px 80px' }}>
        <div className="bottom-cta-card">
          <h2>Ready To Embark On The Journey Of A Lifetime?</h2>
          <p>
            Browse curated tour bundles from certified global operators or connect with our team for personalized private group itineraries.
          </p>
          <div>
            <Link href="/packages" className="btn btn-white btn-lg">
              Book Your Next Journey
            </Link>
          </div>

          <div className="mosaic-strip">
            <div className="mosaic-strip-img">
              <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80" alt="Kyoto" />
            </div>
            <div className="mosaic-strip-img">
              <img src="https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=400&q=80" alt="Norway" />
            </div>
            <div className="mosaic-strip-img">
              <img src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=400&q=80" alt="Tropics" />
            </div>
            <div className="mosaic-strip-img">
              <img src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80" alt="Fjord" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
