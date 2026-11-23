import React from 'react';
import {
  Shield, Sparkles, Layers, MessageSquare, Download,
  Search, BookOpen, RefreshCw, FileText, Globe, X
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
      icon: Sparkles,
      step: 'Ctrl+1',
    },
    {
      id: 'viewer' as StudioTab,
      label: 'Visual Studio',
      icon: Layers,
      step: 'Ctrl+2',
    },
    {
      id: 'qa' as StudioTab,
      label: 'Policy Intelligence',
      icon: MessageSquare,
      step: 'Ctrl+3',
    },
    {
      id: 'export' as StudioTab,
      label: 'Export & Handoff',
      icon: Download,
      step: 'Ctrl+4',
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
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Rail (Operate 220px Left Rail from IncidentIQ / AgentOps) */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 w-[220px] min-w-[220px] max-w-[220px] bg-[#FAFAFA] text-[#09090B] flex flex-col border-r border-[#EAEAEA] px-3 py-4 transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 1. Brand Lockup */}
        <div className="flex items-center justify-between pb-4 px-1">
          <div
            onClick={onBackToWebsite}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md bg-[#000000] text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform shadow-xs">
              <Shield className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[#09090B]">
              PolicyVision
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-medium text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] px-1.5 py-0.5 rounded">
              Ops
            </span>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 text-[#71717A] hover:text-[#09090B] rounded-md md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Navigation Items (AgentOps applyNavStyle) */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#09090B] border border-[#E4E4E7] shadow-[0_1px_2px_rgba(0,0,0,0.04)] font-medium'
                    : 'bg-transparent text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#09090B] border border-transparent font-normal'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#18181B]' : 'text-[#71717A]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  {item.step}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 3. Quick Jump Command Palette (Ctrl+K) */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F5] border border-[#E4E4E7] transition-colors text-left mt-3.5 shadow-2xs cursor-pointer"
            title="Open command palette (⌘K)"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="text-[12.5px] text-[#71717A] font-normal">Quick jump</span>
            </div>
            <kbd className="text-[9px] font-mono bg-[#F4F4F5] border border-[#E4E4E7] px-1.5 py-0.5 rounded text-[#71717A]">
              ⌘K
            </kbd>
          </button>
        )}

        {/* 4. Active Document Status */}
        {documentName ? (
          <div className="mt-4 px-2.5 py-2 rounded-lg bg-white border border-[#E4E4E7] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span className="text-[10px] font-bold text-[#158142] uppercase tracking-wider">
                  Active Policy
                </span>
              </div>
              {onNewSession && (
                <button
                  onClick={onNewSession}
                  title="Reset active policy"
                  className="text-[10px] text-[#71717A] hover:text-[#09090B] flex items-center gap-0.5 hover:underline"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
              <span className="text-xs font-semibold text-[#09090B] truncate" title={documentName}>
                {documentName}
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => handleTabClick('upload')}
            className="mt-4 px-2.5 py-2 rounded-lg bg-white border border-dashed border-[#D4D4D8] hover:border-[#18181B] cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#71717A] group-hover:text-[#09090B]">
                No Policy Loaded
              </span>
              <span className="text-[10px] bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7] px-1.5 py-0.5 rounded font-medium">
                Upload
              </span>
            </div>
          </div>
        )}

        {/* 5. Intelligence Tools */}
        <div className="mt-4 space-y-1">
          <div className="px-2 mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#A1A1AA]">
            Intelligence
          </div>
          {onOpenCitationDrawer && (
            <button
              onClick={onOpenCitationDrawer}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors text-left text-xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-3.5 h-3.5 text-[#52525B]" />
                <span>IRDAI Citations</span>
              </div>
              <span className="text-[10px] bg-[#C0F2B5] text-[#17510B] px-1.5 py-0.2 rounded-full font-bold">
                Verified
              </span>
            </button>
          )}

          <div className="flex items-center justify-between px-3 py-1.5 text-[#52525B] text-xs">
            <div className="flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5 text-[#52525B]" />
              <span>Script</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] px-1.5 py-0.2 rounded font-bold">
              {selectedLanguage}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* 6. Utility Footer (AgentOps bottom rail) */}
        <div className="border-t border-[#EAEAEA] pt-3.5 space-y-2 mt-auto">
          <div className="flex items-center space-x-2 text-xs font-medium text-[#52525B]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>API connected</span>
          </div>
          <div className="text-xs font-medium text-[#18181B] truncate">
            {user?.name || user?.email || 'Policyholder'}
          </div>
          <div className="flex items-center space-x-2 text-xs text-[#52525B]">
            <button
              onClick={onBackToWebsite}
              className="hover:text-[#09090B] font-medium transition-colors cursor-pointer"
            >
              Website
            </button>
            <span className="text-[#D4D4D8]">·</span>
            <button
              onClick={onSignOut}
              className="hover:text-[#B91C1C] hover:bg-[#FEF2F2] px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
