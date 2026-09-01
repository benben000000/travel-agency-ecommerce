'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const VIBES = [
  {
    video: 'https://cdn.coverr.co/videos/coverr-flying-over-a-rocky-beach-2675/1080p.mp4',
    title: 'Adventure Starts With Your Journey',
    desc: 'Curated itineraries, certified tour operators, and personalized travel paths across the world extraordinary destinations.',
  },
  {
    video: 'https://cdn.coverr.co/videos/coverr-aerial-view-of-mountains-in-winter-3382/1080p.mp4',
    title: 'Conquer Iconic Glacial Peaks',
    desc: 'Explore alpine wonderlands, breathtaking mountain passes, and panoramic vistas crafted for true wanderers.',
  },
  {
    video: 'https://cdn.coverr.co/videos/coverr-drone-view-of-a-boat-in-the-sea-5484/1080p.mp4',
    title: 'Discover Untouched Azure Waters',
    desc: 'Sail crystal-clear coastlines, remote islands, and hidden tropical coves with verified local captains.',
  },
  {
    video: 'https://cdn.coverr.co/videos/coverr-waves-reaching-the-shore-at-sunset-5374/1080p.mp4',
    title: 'Chase Golden Sunset Horizons',
    desc: 'Create unforgettable memories under amber skies across the globe most enchanting wilderness escapes.',
  },
];

export default function HeroVideo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % VIBES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const current = VIBES[index];

  return (
    <div className="hero-card hero-video-card">
      {/* Background Videos with Cross-fade */}
      <div className="hero-video-container">
        {VIBES.map((vibe, idx) => (
          <video
            key={vibe.video}
            src={vibe.video}
            autoPlay
            loop
            muted
            playsInline
            className={`hero-bg-video ${idx === index ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="hero-overlay"></div>

      <div className="hero-content">
        <h1 key={`title-${index}`} className="hero-text-fade">
          {current.title}
        </h1>
        <p key={`desc-${index}`} className="hero-text-fade">
          {current.desc}
        </p>
        <div className="hero-actions">
          <Link href="/packages" className="btn btn-white btn-lg">
            Get Started
          </Link>
          <Link href="/packages" className="btn btn-outline-white btn-lg">
            View Packages
          </Link>
        </div>
      </div>
    </div>
  );
}
