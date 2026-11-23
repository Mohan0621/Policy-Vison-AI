import React, { useState, useEffect } from 'react';
import { ArrowRight, LogOut } from 'lucide-react';
import { UserProfile } from '../api/client';

export type PublicPage = 'home' | 'platform' | 'for_teams' | 'about';

interface NavbarProps {
  currentPage: PublicPage;
  onNavigatePage: (page: PublicPage) => void;
  onEnterStudio: () => void;
  user: UserProfile | null;
  onSignInClick: () => void;
  onRegisterClick: () => void;
  onSignOut: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigatePage,
  onEnterStudio,
  user,
  onSignInClick,
  onRegisterClick,
  onSignOut,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { id: PublicPage; label: string }[] = [
    { id: 'platform', label: 'Platform' },
    { id: 'for_teams', label: 'For teams' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
      <div
        className={`mx-auto px-4 sm:px-6 transition-all duration-300 pointer-events-auto ${scrolled
            ? 'max-w-4xl pt-3'
            : 'max-w-7xl pt-4'
          }`}
      >
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full transition-all duration-300 ${scrolled
              ? 'bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-black/[0.08]'
              : 'bg-transparent border border-transparent'
            }`}
        >
          {/* Left: Editorial Navigation Links (Home, Platform, For teams, About) */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigatePage(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${currentPage === item.id
                    ? 'text-[#000000] font-semibold bg-white/60 sm:bg-transparent'
                    : 'text-[#52525B] hover:text-[#000000]'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Center: Brand Capsule Pill (IncidentIQ / Serko signature wordmark) */}
          <div
            onClick={() => {
              onNavigatePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 bg-white/95 px-4 py-1.5 rounded-full border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-black/[0.14] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all cursor-pointer group"
          >
            <span className="text-xs sm:text-sm font-bold text-[#000000] tracking-tight">
              PolicyVision<span className="text-[#1B98F2]">.ai</span>
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onEnterStudio}
                  className="serko-btn-black text-xs py-1.5 px-3.5"
                >
                  Enter Studio
                </button>
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1.5 text-[#71717A] hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onSignInClick}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#52525B] hover:text-[#000000] transition-colors cursor-pointer"
                >
                  Log in
                </button>

                <button
                  onClick={onRegisterClick}
                  className="px-4 py-1.5 rounded-full bg-white text-[#000000] border border-black/[0.1] hover:border-black/[0.2] hover:bg-[#FAFAFA] text-xs font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3 h-3 text-[#71717A]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
