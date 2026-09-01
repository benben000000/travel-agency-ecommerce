'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const VIBES = [
  {
    video: '/videos/travel-1.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    title: 'Adventure Starts With Your Journey',
    desc: 'Curated itineraries, certified tour operators, and personalized travel paths across the world extraordinary destinations.',
  },
  {
    video: '/videos/travel-2.mp4',
    poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    title: 'Discover Extraordinary Destinations',
    desc: 'Explore breathtaking trails, ancient monuments, and unforgettable travel escapes crafted by local experts.',
  },
];

export default function HeroVideo() {
  const [index, setIndex] = useState(0);
  const videoRefs = useRef([]);

  useEffect(() => {
    // Ensure all videos are properly muted and playing
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

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % VIBES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const current = VIBES[index];

  return (
    <div className="hero-fullscreen">
      {/* Background Videos with Smooth Cross-fade */}
      <div className="hero-video-container">
        {VIBES.map((vibe, idx) => (
          <video
            key={vibe.video}
            ref={(el) => (videoRefs.current[idx] = el)}
            src={vibe.video}
            poster={vibe.poster}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`hero-bg-video ${idx === index ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="hero-overlay"></div>

      <div className="container hero-content-container">
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
    </div>
  );
}
