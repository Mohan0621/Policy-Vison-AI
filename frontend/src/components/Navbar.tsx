import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Check, LogOut, Search } from 'lucide-react';
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
  onOpenCommandPalette,
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
    { id: 'home', label: 'Home' },
    { id: 'platform', label: 'Platform' },
    { id: 'for_teams', label: 'For teams' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
      <div
        className={`mx-auto px-4 sm:px-6 transition-all duration-300 pointer-events-auto ${
          scrolled
            ? 'max-w-4xl pt-3'
            : 'max-w-7xl pt-4'
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full transition-all duration-300 ${
            scrolled
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
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === item.id
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
            className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-black/[0.14] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-md bg-[#000000] text-white flex items-center justify-center font-bold text-[10px] group-hover:scale-105 transition-transform">
              <Shield className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#000000] tracking-tight">
              PolicyVision<span className="text-[#1B98F2]">.ai</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[#17510B] bg-[#C0F2B5] px-2 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5" />
              Visual Gen
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#000000] border border-[#E4E4E7] text-xs transition-colors"
                title="Open Command Palette (⌘K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Search...</span>
                <kbd className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#D4D4D8] text-[#52525B]">⌘K</kbd>
              </button>
            )}

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
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#52525B] hover:text-[#000000] transition-colors"
                >
                  Log in
                </button>

                {/* Serko Rainbow Button */}
                <button
                  onClick={onRegisterClick}
                  className="serko-btn-rainbow"
                >
                  <span className="!text-xs !py-1.5 !px-3 sm:!px-4 flex items-center gap-1.5">
                    Launch Studio <ArrowRight className="w-3 h-3 text-[#000000]" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
