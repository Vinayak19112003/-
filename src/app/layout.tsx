
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { StreamerModeProvider } from '@/contexts/streamer-mode-context';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Anony Trading',
  description: 'A modern journal for professionals.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

const fontBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const fontHeadline = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("font-body antialiased", fontBody.variable, fontHeadline.variable)}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <StreamerModeProvider>
              {children}
              <Toaster />
            </StreamerModeProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
