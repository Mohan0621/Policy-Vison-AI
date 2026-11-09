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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 sm:px-12 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs tracking-wider transition-colors group-hover:bg-orange-600">
            PV
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-slate-950 tracking-tight">
                Policy<span className="text-orange-600">Vision</span> AI
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation */}
        {user ? (
          /* Authenticated Studio Tabs */
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          /* Public Landing Navigation */
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('landing')}
              className="hover:text-slate-950 transition-colors"
            >
              Overview
            </button>
            <a href="#workbench" className="hover:text-slate-950 transition-colors">
              Workbench
            </a>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-400 font-mono">IRDAI Guidelines Bounded</span>
          </nav>
        )}

        {/* Right side: Active Document, Session Reset & User Profile */}
        <div className="flex items-center space-x-3">
          {documentName && (
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 max-w-[220px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate" title={documentName}>{documentName}</span>
            </div>
          )}

          {documentName && onNewSession && (
            <button
              onClick={onNewSession}
              title="Reset current policy session"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {user ? (
            /* User profile & Sign Out */
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                  {user.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {user.role}
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out of PolicyVision"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Guest Actions */
            <div className="flex items-center space-x-2">
              <button
                onClick={onSignInClick}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onRegisterClick}
                className="btn-primary text-xs py-1.5 px-3.5"
              >
                Open Studio
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
