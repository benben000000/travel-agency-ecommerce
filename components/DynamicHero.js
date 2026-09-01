'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const HERO_SCENES = [
  {
    id: 1,
    location: 'Amalfi Coast, Italy',
    region: 'Mediterranean Paradise',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
    headline: 'Adventure Starts With Your Journey',
    tagline: 'Curated coastal escapes, private yacht charters, and cliffside retreats above azure Mediterranean waters.',
    shortName: 'Amalfi Coast',
    motionClass: 'motion-zoom-in',
  },
  {
    id: 2,
    location: 'Swiss Alps, Switzerland',
    region: 'Alpine Majesty',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=85',
    headline: 'Conquer Iconic Glacial Peaks',
    tagline: 'Scenic mountain rail passages, panoramic glacier traverses, and luxury alpine chalets in the heart of Europe.',
    shortName: 'Swiss Alps',
    motionClass: 'motion-pan-right',
  },
  {
    id: 3,
    location: 'Kyoto, Japan',
    region: 'Timeless Heritage',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85',
    headline: 'Immerse in Ancient Cultures',
    tagline: 'Serene bamboo groves, lantern-lit temple sanctuaries, and master-guided tea ceremonies across Japan.',
    shortName: 'Kyoto Heritage',
    motionClass: 'motion-pan-left',
  },
  {
    id: 4,
    location: 'Serengeti, Tanzania',
    region: 'Untamed Wilderness',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=85',
    headline: 'Witness the Great Migration',
    tagline: 'Thrilling open-air 4x4 wildlife safaris, hot air balloon sunrises, and eco-luxury tented savannah lodges.',
    shortName: 'Serengeti Safari',
    motionClass: 'motion-zoom-out',
  },
];

const SCENE_DURATION_MS = 6500;

export default function DynamicHero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const activeScene = HERO_SCENES[currentIndex];

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    setProgress(0);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / SCENE_DURATION_MS) * 100);
      setProgress(pct);
    }, 50);

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SCENES.length);
    }, SCENE_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPlaying]);

  function handleSelectScene(idx) {
    setCurrentIndex(idx);
    setProgress(0);
  }

  function handleTogglePlay() {
    setIsPlaying((prev) => !prev);
  }

  return (
    <div className="dynamic-hero-card">
      {/* Dynamic Background Panorama Slides with Ken Burns Motion */}
      <div className="dynamic-hero-backdrop-container">
        {HERO_SCENES.map((scene, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={scene.id}
              className={`dynamic-hero-slide ${isActive ? 'active' : ''} ${scene.motionClass}`}
              style={{
                backgroundImage: `url(${scene.image})`,
              }}
              aria-hidden={!isActive}
            />
          );
        })}
      </div>

      {/* Atmospheric Multi-layered Gradient & Shimmer Overlay */}
      <div className="dynamic-hero-overlay" />
      <div className="dynamic-hero-ambient-glow" />

      {/* Floating Dynamic Particle Orbs */}
      <div className="hero-orb hero-orb-cyan" />
      <div className="hero-orb hero-orb-gold" />

      {/* Main Hero Content */}
      <div className="dynamic-hero-content">
        {/* Live Radar Destination Badge */}
        <div className="dynamic-destination-badge">
          <span className="live-radar-dot">
            <span className="radar-ping" />
            <span className="radar-core" />
          </span>
          <span className="destination-badge-text">
            {activeScene.location} &bull; <span className="destination-badge-region">{activeScene.region}</span>
          </span>
        </div>

        {/* Dynamic Headings */}
        <h1 className="dynamic-hero-headline keyframe-fade-in" key={`h1-${currentIndex}`}>
          {activeScene.headline}
        </h1>
        <p className="dynamic-hero-tagline keyframe-fade-in" key={`p-${currentIndex}`}>
          {activeScene.tagline}
        </p>

        {/* Action Buttons */}
        <div className="dynamic-hero-actions">
          <Link href="/packages" className="btn btn-white btn-lg hero-cta-btn">
            <span>Explore All Packages</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
          <Link href="/packages?featured=true" className="btn btn-outline-white btn-lg hero-secondary-btn">
            <span>Featured Expeditions</span>
          </Link>
        </div>

        {/* Glassmorphic Stats Pill */}
        <div className="hero-floating-stats">
          <div className="stats-pill-item">
            <span className="stats-pill-icon">✨</span>
            <span className="stats-pill-text"><strong>73</strong> Curated Packages</span>
          </div>
          <span className="stats-pill-sep">&bull;</span>
          <div className="stats-pill-item">
            <span className="stats-pill-icon">⭐</span>
            <span className="stats-pill-text"><strong>4.9/5</strong> Traveler Rating</span>
          </div>
          <span className="stats-pill-sep">&bull;</span>
          <div className="stats-pill-item">
            <span className="stats-pill-icon">🛡️</span>
            <span className="stats-pill-text"><strong>100%</strong> Certified Hosts</span>
          </div>
        </div>
      </div>

      {/* Interactive Scene Switcher Controller */}
      <div className="dynamic-hero-controls">
        <div className="scene-switcher-pills">
          {HERO_SCENES.map((scene, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={scene.id}
                type="button"
                className={`scene-pill ${isCurrent ? 'active' : ''}`}
                onClick={() => handleSelectScene(idx)}
                aria-label={`Switch to ${scene.location}`}
              >
                <span className="scene-pill-num">0{idx + 1}</span>
                <span className="scene-pill-name">{scene.shortName}</span>
                {isCurrent && isPlaying && (
                  <span className="scene-pill-progress-track">
                    <span
                      className="scene-pill-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Motion Pause / Resume Toggle */}
        <button
          type="button"
          className="hero-motion-toggle"
          onClick={handleTogglePlay}
          title={isPlaying ? 'Pause dynamic motion' : 'Resume dynamic motion'}
          aria-label={isPlaying ? 'Pause dynamic motion' : 'Resume dynamic motion'}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"></rect>
              <rect x="14" y="4" width="4" height="16" rx="1"></rect>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
          <span>{isPlaying ? 'Motion ON' : 'Paused'}</span>
        </button>
      </div>
    </div>
  );
}
