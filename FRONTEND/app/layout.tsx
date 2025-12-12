import { Metadata } from 'next';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { LoadingScreenProvider } from '@/components/providers/LoadingScreenProvider';
import { PageTransitionProvider } from '@/components/providers/PageTransitionProvider';
import Navbar from '@/components/organisms/Navbar/Navbar';
import PageTransition from '@/components/organisms/PageTransition/PageTransition';
import './globals.css';

export const metadata: Metadata = {
  title: 'Postit App',
  description: 'App per creare postit e commenti',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <ThemeProvider>
          <LoadingScreenProvider>
            <PageTransitionProvider>
              <Navbar />
              <div style={{ marginTop: '70px', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
                {children}
              </div>
              <PageTransition />
            </PageTransitionProvider>
          </LoadingScreenProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

