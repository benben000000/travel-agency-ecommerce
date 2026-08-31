import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div style={{ marginBottom: '16px' }}>
              <img
                src="/images/global1-logo.png"
                alt="Global 1"
                style={{ height: '36px', width: 'auto' }}
              />
            </div>
            <p>Your gateway to extraordinary journeys. We connect travelers with verified tour operators and travel agents worldwide.</p>
          </div>
          <div className="footer-col">
            <h4>Explore Destinations</h4>
            <Link href="/packages?destination=asia">Asia Expeditions</Link>
            <Link href="/packages?destination=europe">European Journeys</Link>
            <Link href="/packages?destination=americas">Americas Discoveries</Link>
            <Link href="/packages?destination=africa">African Safaris</Link>
          </div>
          <div className="footer-col">
            <h4>Customer Service</h4>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Support</Link>
            <Link href="/login">Traveler Sign In</Link>
            <Link href="/register">Create Traveler Account</Link>
          </div>
          <div className="footer-col">
            <h4>Corporate</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
              Global 1 Onetech Platform
            </p>
            <p style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
              Direct Marketplace &copy; {year}
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{year} Global One Travel. A Global 1 Onetech Venture. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
