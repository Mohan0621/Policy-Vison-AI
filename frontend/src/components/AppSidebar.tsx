import React from 'react';
import {
  Shield, Sparkles, Layers, MessageSquare, Download,
  Search, BookOpen, LogOut, ArrowLeft, RefreshCw, FileText,
  CheckCircle2, Plus, Globe, X
} from 'lucide-react';
import { UserProfile } from '../api/client';

export type StudioTab = 'upload' | 'viewer' | 'qa' | 'export';

interface AppSidebarProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  documentName?: string;
  onNewSession?: () => void;
  user: UserProfile | null;
  onBackToWebsite: () => void;
  onSignOut: () => void;
  onOpenCommandPalette?: () => void;
  onOpenCitationDrawer?: () => void;
  selectedLanguage?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  documentName,
  onNewSession,
  user,
  onBackToWebsite,
  onSignOut,
  onOpenCommandPalette,
  onOpenCitationDrawer,
  selectedLanguage = 'en',
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'upload' as StudioTab,
      label: 'Policy Ingestion',
      sublabel: 'Upload & Parse PDF',
      icon: Sparkles,
      step: '01',
    },
    {
      id: 'viewer' as StudioTab,
      label: 'Visual Studio',
      sublabel: 'Infographics & Flowcharts',
      icon: Layers,
      step: '02',
    },
    {
      id: 'qa' as StudioTab,
      label: 'Policy Intelligence',
      sublabel: 'Grounded Q&A Chat',
      icon: MessageSquare,
      step: '03',
    },
    {
      id: 'export' as StudioTab,
      label: 'Export & Handoff',
      sublabel: '150 DPI & CIS Bundle',
      icon: Download,
      step: '04',
    },
  ];

  const handleTabClick = (tab: StudioTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 w-72 bg-white text-[#09090B] flex flex-col border-r border-[#E5E7EB] transition-transform duration-300 ease-in-out shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 1. Header / Brand Bar */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div
            onClick={onBackToWebsite}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B98F2] to-[#7928CA] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#09090B]">PolicyVision</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#1B98F2]/10 text-[#1B98F2] border border-[#1B98F2]/20 uppercase tracking-wider">
                  Studio 2.0
                </span>
              </div>
              <p className="text-[10px] text-[#71717A]">IRDAI Visual Diffusion</p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-md md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Active Policy Status Card */}
        <div className="p-3.5 border-b border-[#E5E7EB]">
          {documentName ? (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                  </span>
                  <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
                    Indexed Policy
                  </span>
                </div>
                {onNewSession && (
                  <button
                    onClick={onNewSession}
                    title="Change or reset active policy"
                    className="text-[10px] text-[#71717A] hover:text-[#09090B] flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                <span
                  className="text-xs font-semibold text-[#0F172A] truncate"
                  title={documentName}
                >
                  {documentName}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleTabClick('upload')}
              className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] hover:border-[#1B98F2] rounded-xl p-3 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1B98F2]" />
                  <span className="text-xs font-medium text-[#64748B] group-hover:text-[#09090B]">
                    No Policy Loaded
                  </span>
                </div>
                <span className="text-[10px] bg-[#E2E8F0] text-[#475569] px-2 py-0.5 rounded-full group-hover:bg-[#1B98F2] group-hover:text-white transition-colors">
                  Upload
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Studio Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Workbench
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                      isActive
                        ? 'bg-[#1B98F2]/10 text-[#1B98F2] border border-[#1B98F2]/30 shadow-2xs'
                        : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#1B98F2] text-white shadow-xs'
                            : 'bg-[#F4F4F5] text-[#71717A] group-hover:text-[#09090B] group-hover:bg-[#E4E4E7]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isActive ? 'text-[#09090B]' : 'text-[#27272A]'}`}>
                          {item.label}
                        </div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-[#1B98F2]' : 'text-[#71717A]'}`}>
                          {item.sublabel}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ml-2 ${isActive ? 'text-[#1B98F2] font-bold' : 'text-[#A1A1AA]'}`}>
                      {item.step}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 4. Intelligence & Tools */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Intelligence Tools
            </div>
            <div className="space-y-1">
              {onOpenCitationDrawer && (
                <button
                  onClick={onOpenCitationDrawer}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span className="text-xs font-medium">IRDAI Citations</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-[#15803D] border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-medium">
                    Verified
                  </span>
                </button>
              )}

              {onOpenCommandPalette && (
                <button
                  onClick={onOpenCommandPalette}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <Search className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="text-xs font-medium">Command Palette</span>
                  </div>
                  <kbd className="text-[9px] font-mono bg-[#F4F4F5] border border-[#E4E4E7] px-1.5 py-0.5 rounded text-[#71717A]">
                    ⌘K
                  </kbd>
                </button>
              )}

              <div className="flex items-center justify-between px-3 py-2 text-[#52525B] text-xs">
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="font-medium">Active Script</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                  {selectedLanguage}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Diffusion Specs Badge */}
        <div className="px-4 py-2.5 bg-[#F9FAFB] border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between text-[11px] text-[#71717A]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              <span className="font-medium text-[#52525B]">1024×1024 • 150 DPI</span>
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8]">IRDAI BFSI</span>
          </div>
        </div>

        {/* 6. User Profile & Website Jump Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1B98F2] to-[#FF8C51] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#09090B] truncate">
                  {user?.name || 'Policyholder'}
                </div>
                <div className="text-[10px] text-[#71717A] truncate">
                  {user?.role || 'Standard Workspace'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={onBackToWebsite}
                title="Return to Marketing Website"
                className="p-1.5 text-[#71717A] hover:text-[#09090B] rounded-lg hover:bg-[#F4F4F5] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onSignOut}
                title="Sign out of PolicyVision"
                className="p-1.5 text-[#71717A] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
