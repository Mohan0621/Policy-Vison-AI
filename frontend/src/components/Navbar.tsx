import React from 'react';
import { RefreshCw, FileText, Eye, MessageSquare, Download, LogOut } from 'lucide-react';
import { UserProfile } from '../api/client';

interface NavbarProps {
  activeTab: 'landing' | 'upload' | 'viewer' | 'qa' | 'export' | 'auth';
  setActiveTab: (tab: 'landing' | 'upload' | 'viewer' | 'qa' | 'export' | 'auth') => void;
  documentName?: string;
  onNewSession?: () => void;
  user: UserProfile | null;
  onSignInClick: () => void;
  onRegisterClick: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  documentName,
  onNewSession,
  user,
  onSignInClick,
  onRegisterClick,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FCF8EF]/95 backdrop-blur-md border-b border-[#ECD9B9] px-6 sm:px-12 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity (Clinia exact typographical layout) */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-[#1A1A1E] text-white flex items-center justify-center font-bold text-xs tracking-wider transition-colors group-hover:bg-[#FF5C00]">
            PV
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-[#1A1A1E] tracking-tight">
                Policy<span className="text-[#FF5C00]">Vision</span>
              </span>
              <span className="font-mono text-[10px] text-[#53402C] bg-[#F2EEE5] border border-[#ECD9B9] px-1.5 py-0.5 rounded-full">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation */}
        {user ? (
          /* Authenticated Studio Tabs */
          <nav className="hidden md:flex items-center space-x-1.5 bg-[#F2EEE5] p-1 rounded-full border border-[#ECD9B9]">
            {[
              { id: 'upload', label: 'Upload Document', icon: FileText },
              { id: 'viewer', label: 'Visuals & Citations', icon: Eye },
              { id: 'qa', label: 'Policy Q&A', icon: MessageSquare },
              { id: 'export', label: 'Export', icon: Download },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1A1A1E] text-white shadow-2xs font-semibold'
                      : 'text-[#53402C] hover:text-[#1A1A1E] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5C00]' : 'text-[#95795C]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          /* Clinia Exact Public Navigation (ff-mono tt-uppercase) */
          <nav className="hidden md:flex items-center space-x-8 font-mono text-xs uppercase tracking-wider text-[#53402C]">
            <button
              onClick={() => setActiveTab('landing')}
              className="hover:text-[#1A1A1E] transition-colors"
            >
              Product
            </button>
            <a href="#policies" className="hover:text-[#1A1A1E] transition-colors">
              Context Engine
            </a>
            <a href="#policies" className="hover:text-[#1A1A1E] transition-colors">
              Schedules
            </a>
            <span className="text-[#ECD9B9]">|</span>
            <span className="text-[11px] text-[#95795C] font-mono normal-case">
              IRDAI Guidelines Bounded
            </span>
          </nav>
        )}

        {/* Right side: Active Document, Session Reset & User Profile */}
        <div className="flex items-center space-x-3">
          {documentName && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#ECD9B9] text-xs font-mono text-[#1A1A1E] max-w-[220px]">
              <span className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0" />
              <span className="truncate" title={documentName}>{documentName}</span>
            </div>
          )}

          {documentName && onNewSession && (
            <button
              onClick={onNewSession}
              title="Reset current policy session"
              className="p-1.5 text-[#53402C] hover:text-[#1A1A1E] rounded-full hover:bg-[#F2EEE5] border border-[#ECD9B9] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {user ? (
            /* User profile & Sign Out */
            <div className="flex items-center space-x-3 pl-3 border-l border-[#ECD9B9]">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#1A1A1E] truncate max-w-[140px]">
                  {user.name}
                </div>
                <div className="text-[10px] font-mono text-[#95795C]">
                  {user.role}
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out of PolicyVision"
                className="p-1.5 text-[#95795C] hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Clinia Guest CTAs: Login (--cta-transparent) + Launch Studio (--cta) */
            <div className="flex items-center space-x-2">
              <button
                onClick={onSignInClick}
                className="btn-clinia-transparent text-xs py-1.5 px-4 font-mono uppercase tracking-wider"
              >
                Login
              </button>
              <button
                onClick={onRegisterClick}
                className="btn-clinia-vital text-xs py-1.5 px-4 font-mono uppercase tracking-wider"
              >
                Studio
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
