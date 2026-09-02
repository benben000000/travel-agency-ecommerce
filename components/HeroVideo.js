'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const VIBES = [
  {
    video: '/videos/travel-1.mp4',
    title: 'Adventure Starts With Your Journey',
    desc: 'Curated itineraries, certified tour operators, and personalized travel paths across the world extraordinary destinations.',
  },
  {
    video: '/videos/beach-overhead.mp4',
    title: 'Discover Untouched Tropical Paradises',
    desc: 'Bask in crystal-clear turquoise waters, secluded coral atolls, and private island retreats designed for pure serenity.',
  },
  {
    video: '/videos/table-mountain.mp4',
    title: 'Conquer Iconic Mountain Expeditions',
    desc: 'Traverse panoramic alpine summits, dramatic cloud valleys, and glacial passes led by veteran wilderness guides.',
  },
  {
    video: '/videos/beach-cliffs.mp4',
    title: 'Explore Rugged Coastal Wonders',
    desc: 'Marvel at timeless sea cliffs, dramatic ocean swells, and historic coastal paths carved along the world edges.',
  },
  {
    video: '/videos/sunset.mp4',
    title: 'Chase Golden Sunset Horizons',
    desc: 'Create unforgettable memories under amber twilight skies across the globe most enchanting wilderness escapes.',
  },
];

export default function HeroVideo({ children }) {
  const [index, setIndex] = useState(0);
  const videoRefs = useRef([]);

  useEffect(() => {
    // Ensure all videos have proper DOM muted properties for 100% autoplay compliance
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    });

    // Advance to next 4K video vibe every 8 seconds
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % VIBES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  // When active video changes, ensure it plays smoothly
  useEffect(() => {
    const activeVideo = videoRefs.current[index];
    if (activeVideo) {
      activeVideo.muted = true;
      activeVideo.defaultMuted = true;
      const p = activeVideo.play();
      if (p !== undefined) p.catch(() => {});
    }
  }, [index]);

  const current = VIBES[index];

  return (
    <div className="hero-fullscreen">
      {/* 4K Cinematic Background Video Loop Container */}
      <div className="hero-video-container">
        {VIBES.map((vibe, idx) => (
          <video
            key={vibe.video}
            ref={(el) => (videoRefs.current[idx] = el)}
            src={vibe.video}
            autoPlay
            loop
            muted
            playsInline
            preload={idx === 0 || idx === 1 ? 'auto' : 'metadata'}
            className={`hero-bg-video ${idx === index ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Cinematic Dark Gradient Overlay for Maximum Legibility */}
      <div className="hero-overlay"></div>

      {/* Centered Clean Typography & In-Hero Search Card */}
      <div className="container hero-content-container">
        <div className="hero-content hero-content-centered">
          <h1 key={`title-${index}`} className="hero-text-fade">
            {current.title}
          </h1>
          <p key={`desc-${index}`} className="hero-text-fade">
            {current.desc}
          </p>

          {/* Search Card Centered Inside Hero */}
          {children && (
            <div className="hero-centered-search-wrap">
              {children}
            </div>
          )}

          <div className="hero-actions hero-actions-centered">
            <Link href="/packages" className="btn btn-white btn-lg">
              Get Started
            </Link>
            <Link href="/packages" className="btn btn-outline-white btn-lg">
              View Packages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
