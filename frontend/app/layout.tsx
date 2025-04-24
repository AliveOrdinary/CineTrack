import './globals.css';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import Header from '@/components/header';
import { Toaster } from "@/components/ui/toaster"
import QueryProvider from '@/lib/providers/query-provider';
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils"

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'CineTrack - Track Your Movies and TV Shows',
  description: 'Track your favorite movies and TV shows, create watchlists, and connect with other film enthusiasts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased dark',
        fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
            </div>
            <footer className="border-t border-gray-800 mt-12">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                  <p className="text-gray-500">
                    &copy; {new Date().getFullYear()} CineTrack. All rights reserved.
                  </p>
                  <p className="text-gray-500 mt-2 sm:mt-0">
                    Powered by <a href="https://www.themoviedb.org/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">TMDB</a>
                  </p>
                </div>
              </div>
            </footer>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 