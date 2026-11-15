import React from 'react';
import {
  Menu, Search, ArrowLeft, Plus, Globe, Sparkles,
  Layers, MessageSquare, Download, Check
} from 'lucide-react';
import { StudioTab } from './AppSidebar';

interface WorkspaceTopBarProps {
  activeTab: StudioTab;
  documentName?: string;
  selectedLanguage: string;
  onOpenCommandPalette?: () => void;
  onOpenCitationDrawer?: () => void;
  onNewSession?: () => void;
  onBackToWebsite: () => void;
  onToggleMobile?: () => void;
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  activeTab,
  documentName,
  selectedLanguage,
  onOpenCommandPalette,
  onOpenCitationDrawer,
  onNewSession,
  onBackToWebsite,
  onToggleMobile,
}) => {
  const tabTitles: Record<StudioTab, { title: string; icon: React.ElementType }> = {
    upload: { title: 'Policy Ingestion & Synthesis', icon: Sparkles },
    viewer: { title: 'Visual Explainer Studio', icon: Layers },
    qa: { title: 'Policy Intelligence Q&A', icon: MessageSquare },
    export: { title: 'Export & Asset Packaging', icon: Download },
  };

  const currentTab = tabTitles[activeTab] || tabTitles.upload;
  const TabIcon = currentTab.icon;

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center space-x-3 min-w-0">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="md:hidden p-1.5 text-[#71717A] hover:text-[#000000] rounded-lg hover:bg-[#F4F4F5] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#71717A] font-medium hidden sm:inline">Studio</span>
          <span className="text-[#D4D4D8] hidden sm:inline">/</span>
          <div className="flex items-center space-x-1.5 font-bold text-[#000000]">
            <TabIcon className="w-3.5 h-3.5 text-[#1B98F2]" />
            <span className="truncate">{currentTab.title}</span>
          </div>
        </div>

        {documentName && (
          <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-[#E5E7EB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#158142]" />
            <span className="text-xs font-mono text-[#52525B] truncate max-w-[200px]" title={documentName}>
              {documentName}
            </span>
          </div>
        )}
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Command Palette Button */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#000000] border border-[#E4E4E7] text-xs transition-colors"
            title="Search Actions (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Search</span>
            <kbd className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#D4D4D8] text-[#52525B]">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Citation trigger pill */}
        {onOpenCitationDrawer && (
          <button
            onClick={onOpenCitationDrawer}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#158142] border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>IRDAI Citations</span>
          </button>
        )}

        {/* Language Indicator */}
        <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-xs font-medium text-[#52525B]">
          <Globe className="w-3 h-3 text-[#1B98F2]" />
          <span className="uppercase text-[11px] font-mono">{selectedLanguage}</span>
        </div>

        {/* New Policy reset button */}
        {documentName && onNewSession && (
          <button
            onClick={onNewSession}
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#52525B] hover:text-[#000000] hover:bg-[#F4F4F5] border border-[#E5E7EB] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">New Policy</span>
          </button>
        )}

        {/* Website Link */}
        <button
          onClick={onBackToWebsite}
          className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#52525B] hover:text-[#000000] hover:bg-[#F4F4F5] border border-[#E5E7EB] transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Website</span>
        </button>
      </div>
    </header>
  );
};
