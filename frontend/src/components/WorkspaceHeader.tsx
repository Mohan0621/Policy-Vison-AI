import React from 'react';
import {
  Shield, ArrowLeft, LogOut, RefreshCw, Sparkles,
  Layers, MessageSquare, Download, Check, Search
} from 'lucide-react';
import { UserProfile } from '../api/client';

interface WorkspaceHeaderProps {
  activeTab: 'upload' | 'viewer' | 'qa' | 'export';
  setActiveTab: (tab: 'upload' | 'viewer' | 'qa' | 'export') => void;
  documentName?: string;
  onNewSession?: () => void;
  user: UserProfile | null;
  onBackToWebsite: () => void;
  onSignOut: () => void;
  onOpenCommandPalette?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  activeTab,
  setActiveTab,
  documentName,
  onNewSession,
  user,
  onBackToWebsite,
  onSignOut,
  onOpenCommandPalette,
}) => {
  const tabs = [
    { id: 'upload', label: '1. Generate Visuals', icon: Sparkles },
    { id: 'viewer', label: '2. Visual Gallery', icon: Layers },
    { id: 'qa', label: '3. Q&A Intelligence', icon: MessageSquare },
    { id: 'export', label: '4. Export Assets', icon: Download },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB] px-4 sm:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand + Website Jump Pill (AgentOps style) */}
        <div className="flex items-center space-x-3 shrink-0">
          <div
            onClick={onBackToWebsite}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
              <Shield className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-sm font-bold text-[#000000] tracking-tight hidden sm:inline">
              PolicyVision<span className="text-[#1B98F2]">.ai</span>
            </span>
          </div>

          <button
            onClick={onBackToWebsite}
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#52525B] hover:text-[#000000] hover:bg-[#F6F6F6] border border-[#E5E7EB] transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Website</span>
          </button>
        </div>

        {/* Center: Segmented Capsule Switcher Track (AgentOps Workspace Track) */}
        <div className="flex bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB] shadow-inner overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#000000] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-[#71717A] hover:text-[#000000]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1B98F2]' : 'text-[#71717A]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Active Document, Live Diffusion Indicator, User, Sign Out */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#000000] border border-[#E4E4E7] text-xs transition-colors"
              title="Command Palette (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#D4D4D8] text-[#52525B]">⌘K</kbd>
            </button>
          )}

          {documentName && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F6F6F6] border border-[#E5E7EB] text-xs font-mono text-[#000000] max-w-[170px]">
              <span className="w-2 h-2 rounded-full bg-[#158142] shrink-0" />
              <span className="truncate" title={documentName}>{documentName}</span>
            </div>
          )}

          {documentName && onNewSession && (
            <button
              onClick={onNewSession}
              title="Reset policy session"
              className="p-1.5 text-[#71717A] hover:text-[#000000] rounded-full hover:bg-[#F6F6F6] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#17510B] bg-[#C0F2B5] px-2.5 py-1 rounded-full">
            <Check className="w-2.5 h-2.5" />
            <span>Diffusion 150 DPI</span>
          </div>

          {user && (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#E5E7EB]">
              <div className="text-right hidden xl:block">
                <p className="text-xs font-bold text-[#000000] truncate max-w-[110px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-[#71717A]">
                  {user.role}
                </p>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out"
                className="p-1.5 text-[#71717A] hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

