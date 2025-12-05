import { Metadata } from 'next';
import ThemeProvider from '@/components/providers/ThemeProvider';
import Navbar from '@/components/organisms/Navbar/Navbar';
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
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

