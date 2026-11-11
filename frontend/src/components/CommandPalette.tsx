import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  MessageSquare,
  Download,
  Languages,
  ArrowRight,
  ShieldCheck,
  FileText,
  Home,
  SlidersHorizontal,
  Building2,
  Info
} from 'lucide-react';
import { IndianLanguage } from '../api/client';
import { useToast } from './SerkoToast';

export interface CommandItem {
  id: string;
  category: 'Navigation' | 'Visual Studio' | 'Languages' | 'IRDAI Compliance';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onSelectLanguage?: (lang: IndianLanguage) => void;
  onOpenCitationDrawer?: () => void;
  onOpenDiffModal?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectLanguage,
  onOpenCitationDrawer,
  onOpenDiffModal,
}) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Visual Studio Actions
    {
      id: 'cmd-diff',
      category: 'Visual Studio',
      title: 'Inspect Before & After Policy Diff',
      subtitle: 'Compare 40-page policy wording with visual explainer',
      icon: SlidersHorizontal,
      shortcut: '⇧ D',
      action: () => {
        onClose();
        if (onOpenDiffModal) onOpenDiffModal();
        else onNavigate('home');
      },
    },
    {
      id: 'cmd-claims-flow',
      category: 'Visual Studio',
      title: 'View Cashless Claims Flowchart',
      subtitle: 'Numbered 4-stage hospital admission to discharge path',
      icon: Layers,
      shortcut: 'G F',
      action: () => {
        onClose();
        onNavigate('viewer');
        toast('Loaded Cashless Claims Flowchart', { type: 'success' });
      },
    },
    {
      id: 'cmd-coverage-info',
      category: 'Visual Studio',
      title: 'View Coverage Benefits Infographic',
      subtitle: 'Inpatient, Day Care, AYUSH & Health Checkup gauges',
      icon: Sparkles,
      shortcut: 'G C',
      action: () => {
        onClose();
        onNavigate('viewer');
        toast('Loaded Coverage Benefits Infographic', { type: 'success' });
      },
    },
    {
      id: 'cmd-citation-drawer',
      category: 'IRDAI Compliance',
      title: 'Open IRDAI Clause Citation Drawer',
      subtitle: 'Deterministic grounding audit & verbatim policy extract',
      icon: ShieldCheck,
      shortcut: '⌘ I',
      action: () => {
        onClose();
        if (onOpenCitationDrawer) onOpenCitationDrawer();
        else toast('Opened Citation Drawer', { type: 'info' });
      },
    },
    {
      id: 'cmd-copy-prompt',
      category: 'Visual Studio',
      title: 'Copy Visual Prompt for Midjourney / SDXL',
      subtitle: 'High-DPI technical prompt with IRDAI design tokens',
      icon: FileText,
      shortcut: '⌘ C',
      action: () => {
        const p = 'Clean modern vector flowchart explainer of cashless health insurance claims process in India, hospital desk pre-auth, TPA 60min SLA, 1024x1024 150 DPI';
        navigator.clipboard.writeText(p);
        onClose();
        toast('Visual Diffusion Prompt copied to clipboard!', { type: 'success' });
      },
    },
    // Navigation
    {
      id: 'cmd-nav-upload',
      category: 'Navigation',
      title: 'Go to Visual Generation Studio',
      subtitle: 'Upload policy PDF or type insurance coverage description',
      icon: Sparkles,
      shortcut: 'G U',
      action: () => {
        onClose();
        onNavigate('upload');
      },
    },
    {
      id: 'cmd-nav-viewer',
      category: 'Navigation',
      title: 'Go to Visual Gallery',
      subtitle: 'Inspect 1024×1024 150 DPI generated assets & lightboxes',
      icon: Layers,
      shortcut: 'G V',
      action: () => {
        onClose();
        onNavigate('viewer');
      },
    },
    {
      id: 'cmd-nav-qa',
      category: 'Navigation',
      title: 'Go to Q&A Intelligence',
      subtitle: 'Ask policy questions grounded in insurance clauses',
      icon: MessageSquare,
      shortcut: 'G Q',
      action: () => {
        onClose();
        onNavigate('qa');
      },
    },
    {
      id: 'cmd-nav-export',
      category: 'Navigation',
      title: 'Go to Asset Export Hub',
      subtitle: 'Download PNG, SVG, PDF and multi-resolution packages',
      icon: Download,
      shortcut: 'G E',
      action: () => {
        onClose();
        onNavigate('export');
      },
    },
    {
      id: 'cmd-nav-home',
      category: 'Navigation',
      title: 'Go to Home / Overview',
      subtitle: 'PolicyVision AI public landing page',
      icon: Home,
      shortcut: 'G H',
      action: () => {
        onClose();
        onNavigate('home');
      },
    },
    {
      id: 'cmd-nav-teams',
      category: 'Navigation',
      title: 'Go to For Teams & Insurers',
      subtitle: 'Enterprise TPAs, brokers, and bancassurance distribution',
      icon: Building2,
      shortcut: 'G T',
      action: () => {
        onClose();
        onNavigate('for_teams');
      },
    },
    {
      id: 'cmd-nav-about',
      category: 'Navigation',
      title: 'Go to About PolicyVision AI',
      subtitle: 'IRDAI-grounded visual clarity mission and architecture',
      icon: Info,
      shortcut: 'G A',
      action: () => {
        onClose();
        onNavigate('about');
      },
    },
    // Languages
    {
      id: 'cmd-lang-hi',
      category: 'Languages',
      title: 'Switch Language to Hindi (हिन्दी)',
      subtitle: 'Policy visual labels rendered in Devanagari script',
      icon: Languages,
      action: () => {
        onClose();
        if (onSelectLanguage) onSelectLanguage('hi');
        toast('Switched Language to Hindi (हिन्दी)', { type: 'success' });
      },
    },
    {
      id: 'cmd-lang-te',
      category: 'Languages',
      title: 'Switch Language to Telugu (తెలుగు)',
      subtitle: 'Policy visual labels rendered in Telugu script',
      icon: Languages,
      action: () => {
        onClose();
        if (onSelectLanguage) onSelectLanguage('te');
        toast('Switched Language to Telugu (తెలుగు)', { type: 'success' });
      },
    },
    {
      id: 'cmd-lang-ta',
      category: 'Languages',
      title: 'Switch Language to Tamil (தமிழ்)',
      subtitle: 'Policy visual labels rendered in Tamil script',
      icon: Languages,
      action: () => {
        onClose();
        if (onSelectLanguage) onSelectLanguage('ta');
        toast('Switched Language to Tamil (தமிழ்)', { type: 'success' });
      },
    },
    {
      id: 'cmd-lang-mr',
      category: 'Languages',
      title: 'Switch Language to Marathi (मराठी)',
      subtitle: 'Policy visual labels rendered in Marathi script',
      icon: Languages,
      action: () => {
        onClose();
        if (onSelectLanguage) onSelectLanguage('mr');
        toast('Switched Language to Marathi (मराठी)', { type: 'success' });
      },
    },
    {
      id: 'cmd-lang-en',
      category: 'Languages',
      title: 'Switch Language to English (Standard)',
      subtitle: 'Standard IRDAI English visual terminology',
      icon: Languages,
      action: () => {
        onClose();
        if (onSelectLanguage) onSelectLanguage('en');
        toast('Switched Language to English', { type: 'info' });
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    );
  });

  // Handle keyboard events (up, down, enter, esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(filteredCommands.length - 1, 0) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Command Palette Card (Linear / Serko style) */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.2)] border border-black/[0.1] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[560px]">
        {/* Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E7EB] gap-3">
          <Search className="w-5 h-5 text-[#71717A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search visuals, or switch languages..."
            className="flex-1 bg-transparent text-sm text-[#000000] placeholder-[#A1A1AA] outline-none font-medium"
          />
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#71717A] bg-[#F4F4F5] px-2 py-0.5 rounded-md border border-[#E4E4E7]">
            <span>ESC</span>
          </div>
        </div>

        {/* Command Items List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#F4F4F5]">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717A] space-y-1">
              <p className="font-semibold text-[#000000]">No commands found</p>
              <p>Try searching for "claims", "flowchart", "hindi", or "export"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#000000] text-white shadow-xs'
                        : 'text-[#18181B] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white/15 text-white'
                            : 'bg-[#F4F4F5] text-[#52525B]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-tight truncate">
                            {cmd.title}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#E4E4E7] text-[#71717A]'
                            }`}
                          >
                            {cmd.category}
                          </span>
                        </div>
                        {cmd.subtitle && (
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-white/70' : 'text-[#71717A]'
                            }`}
                          >
                            {cmd.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {cmd.shortcut && (
                        <kbd
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/30'
                              : 'bg-white text-[#71717A] border-[#E4E4E7]'
                          }`}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#71717A]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E4E4E7] rounded font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E4E4E7] rounded font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E4E4E7] rounded font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#1B98F2]">
            <span>Serko Quick Bar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
