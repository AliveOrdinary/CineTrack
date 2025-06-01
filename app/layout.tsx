import { ThemeSwitcher } from "@/components/theme-switcher";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import AuthStatusHeader from "@/components/features/auth/AuthStatusHeader";
import SearchBar from "@/components/features/search/SearchBar";
import { Toaster } from "sonner";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { NotificationBell } from "@/components/features/notifications/NotificationBell";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CineTrack - Your Ultimate Movie & TV Show Tracker",
  description: "Track, review, and discover movies and TV shows with CineTrack.",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip to main content link for keyboard users */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
          >
            Skip to main content
          </a>
          
          <ErrorBoundaryWrapper>
            <div className="flex min-h-screen flex-col pb-16 md:pb-0">
              <header className="w-full border-b border-b-foreground/10 sticky top-0 z-40 bg-background/95 backdrop-blur-sm" role="banner">
                <nav 
                  className="mx-auto flex max-w-7xl items-center justify-between gap-2 md:gap-4 p-3 md:p-4"
                  role="navigation"
                  aria-label="Main navigation"
                >
                  <div className="flex items-center gap-3 md:gap-6">
                    <Link 
                      href="/" 
                      className="text-lg md:text-xl font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                      aria-label="CineTrack - Go to homepage"
                    >
                      CineTrack
                    </Link>
                    
                    {/* Desktop Navigation Links */}
                    <ul className="hidden md:flex items-center gap-4" role="menubar">
                      <li role="none">
                        <Link 
                          href="/feed" 
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
                          role="menuitem"
                          aria-label="View activity feed"
                        >
                          Feed
                        </Link>
                      </li>
                      <li role="none">
                        <Link 
                          href="/watchlist" 
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
                          role="menuitem"
                          aria-label="View your watchlist"
                        >
                          Watchlist
                        </Link>
                      </li>
                      <li role="none">
                        <Link 
                          href="/lists" 
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
                          role="menuitem"
                          aria-label="View your custom lists"
                        >
                          Lists
                        </Link>
                      </li>
                      <li role="none">
                        <Link 
                          href="/discover" 
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
                          role="menuitem"
                          aria-label="Discover new content"
                        >
                          Discover
                        </Link>
                      </li>
                      <li role="none">
                        <Link 
                          href="/profile" 
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
                          role="menuitem"
                          aria-label="View your profile"
                        >
                          Profile
                        </Link>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Search bar - hidden on mobile, shown on desktop */}
                  <div className="hidden md:flex flex-1 max-w-md mx-4" role="search" aria-label="Search movies and TV shows">
                    <SearchBar className="w-full" />
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4">
                    <NotificationBell />
                    <AuthStatusHeader />
                    <ThemeSwitcher />
                  </div>
                </nav>
                
                {/* Mobile search bar */}
                <div className="md:hidden px-3 pb-3" role="search" aria-label="Search movies and TV shows">
                  <SearchBar className="w-full" />
                </div>
              </header>
              
              <main 
                id="main-content"
                className="flex-1 w-full flex flex-col items-center py-4 md:py-8 min-h-0"
                role="main"
                tabIndex={-1}
              >
                {/* Removed max-w-5xl and p-5 from here, pages can define their own max-width and padding */}
                {children}
              </main>
              
              <footer className="w-full border-t py-6 md:py-8 text-center text-xs bg-background" role="contentinfo">
                <div className="mx-auto max-w-7xl flex justify-center items-center gap-4 px-4">
                  <p>&copy; {new Date().getFullYear()} CineTrack. All rights reserved.</p>
                </div>
              </footer>
              
              {/* Mobile Bottom Navigation */}
              <BottomNavigation />
            </div>
          </ErrorBoundaryWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
