'use client';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/agent') || pathname?.startsWith('/admin');
  if (isDashboard) return null;

  function getDashboardLink() {
    if (!session) return '/login';
    if (session.user.role === 'admin') return '/admin';
    if (session.user.role === 'agent') return '/agent';
    return '/dashboard';
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="header-logo-wrap">
            <img
              src="/images/global1-logo.png"
              alt="Global 1"
              className="header-logo-img"
              style={{ height: '40px', width: 'auto' }}
            />
          </Link>

          <nav className="header-nav">
            <Link href="/">Home</Link>
            <Link href="/packages">Packages</Link>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Support</Link>
          </nav>

          <div className="header-actions">
            <ThemeToggle />
            {session ? (
              <>
                <Link href={getDashboardLink()} className="btn btn-secondary btn-sm">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn btn-sm"
                  style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link href="/packages" className="btn btn-primary btn-sm">
                  Book Now
                </Link>
              </>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <nav className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link href="/packages" onClick={() => setMobileOpen(false)}>Packages</Link>
        <Link href="/about" onClick={() => setMobileOpen(false)}>About Us</Link>
        <Link href="/contact" onClick={() => setMobileOpen(false)}>Support</Link>
        {session ? (
          <>
            <Link href={getDashboardLink()} onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); setMobileOpen(false); signOut({ callbackUrl: '/' }); }}>
              Sign Out
            </a>
          </>
        ) : (
          <>
            <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)}>Register</Link>
          </>
        )}
        <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
