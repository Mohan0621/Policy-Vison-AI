import React from 'react';
import { Sparkles, RefreshCw, FileText, Eye, MessageSquare, Download, LogOut, ChevronRight } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 sm:px-12 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity (matches EvalAI style) */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            PV
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Policy<span className="text-orange-500">Vision</span>
              </span>
              <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">AI Insurance Visual Explainer Studio</p>
          </div>
        </div>

        {/* Center Navigation */}
        {user ? (
          /* Authenticated Studio Tabs */
          <nav className="hidden md:flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            {[
              { id: 'upload', label: 'Upload', icon: FileText },
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
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          /* Public Landing Navigation (EvalAI style) */
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('landing')}
              className="hover:text-orange-600 transition"
            >
              Overview
            </button>
            <a href="#capabilities" className="hover:text-orange-600 transition">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-orange-600 transition">
              Workflow
            </a>
            <a href="#compliance" className="hover:text-orange-600 transition">
              Compliance
            </a>
          </nav>
        )}

        {/* Right side: Auth Controls & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            /* Authenticated User Menu */
            <>
              {documentName && (
                <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate max-w-[120px] font-semibold">{documentName}</span>
                </div>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center space-x-2.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.role}</p>
                </div>
              </div>

              {onNewSession && (
                <button
                  onClick={onNewSession}
                  title="Reset session"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 bg-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 bg-white flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-semibold hidden md:inline">Sign Out</span>
              </button>
            </>
          ) : (
            /* Public Guest Controls */
            <div className="flex items-center space-x-3">
              <button
                onClick={onSignInClick}
                className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                onClick={onRegisterClick}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 hover:opacity-95 transition flex items-center space-x-1"
              >
                <span>Get Started</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
