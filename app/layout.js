import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import ThemeProvider from '@/components/ThemeProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AIConcierge from '@/components/AIConcierge';

export const metadata = {
  title: 'Global One Travel - Your Gateway to Extraordinary Journeys',
  description: 'A multi-vendor travel marketplace connecting travelers with the best tour operators worldwide. Book tours, packages, and experiences.',
  icons: {
    icon: [
      { url: '/images/global1-icon.png' },
      { url: '/icon.png' },
    ],
    shortcut: ['/images/global1-icon.png'],
    apple: [
      { url: '/images/global1-icon.png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <Header />
            {children}
            <Footer />
            <AIConcierge />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
