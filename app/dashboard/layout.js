'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function UserDashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(pathname));
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!session) return null;

  const navItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'My Bookings', href: '/dashboard/bookings' },
    { label: 'Messages', href: '/dashboard/messages' },
    { label: 'Profile', href: '/dashboard/profile' },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <Link href="/" style={{ display: 'block', marginBottom: '14px' }}>
            <img src="/images/global1-logo.png" alt="Global 1" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Traveler Account
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {session.user.name}
          </div>
          <div style={{ marginTop: '12px' }}>
            <ThemeToggle />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <div className="sidebar-section-title">Account</div>
          <nav className="sidebar-nav">
            <Link href="/packages">Explore Marketplace</Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 24px',
                background: 'none',
                border: 'none',
                borderLeft: '3px solid transparent',
                color: 'var(--color-danger)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Sign Out
            </button>
          </nav>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
