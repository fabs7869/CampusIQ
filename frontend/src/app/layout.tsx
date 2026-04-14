import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth';
import { Toaster } from 'react-hot-toast';
import CustomCursor from './components/CustomCursor';
import { ThemeProvider } from '@/context/ThemeContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CampusIQ Platform',
  description: 'Smart Campus Issue & Improvement Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-500/30`}>
        <AuthProvider>
          <ThemeProvider>
            <CustomCursor />
            {children}
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
