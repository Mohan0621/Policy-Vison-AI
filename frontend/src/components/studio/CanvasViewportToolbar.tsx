import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, SlidersHorizontal, Globe, Check } from 'lucide-react';
import { IndianLanguage } from '../../api/client';

interface CanvasViewportToolbarProps {
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  currentLanguage: string;
  onLanguageChange?: (lang: IndianLanguage) => void;
  onOpenLightbox: () => void;
  onExport: () => void;
  isCompareMode: boolean;
  onToggleCompare: () => void;
  isRegenerating?: boolean;
}

const LANGUAGES: Array<{ code: IndianLanguage; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

export const CanvasViewportToolbar: React.FC<CanvasViewportToolbarProps> = ({
  zoomLevel,
  onZoomChange,
  onResetZoom,
  currentLanguage,
  onLanguageChange,
  onOpenLightbox,
  onExport,
  isCompareMode,
  onToggleCompare,
  isRegenerating = false,
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#F6F6F6] p-1.5 rounded-2xl border border-[#E5E7EB] text-xs">
      {/* Left: Zoom Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onZoomChange(Math.max(50, zoomLevel - 25))}
          disabled={zoomLevel <= 50}
          className="p-1.5 rounded-lg text-[#52525B] hover:text-[#000000] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center space-x-0.5 bg-white px-2 py-1 rounded-lg border border-[#E5E7EB] shadow-2xs font-mono font-semibold text-[11px] text-[#000000]">
          <span>{zoomLevel}%</span>
        </div>

        <button
          onClick={() => onZoomChange(Math.min(200, zoomLevel + 25))}
          disabled={zoomLevel >= 200}
          className="p-1.5 rounded-lg text-[#52525B] hover:text-[#000000] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#52525B] hover:text-[#000000] hover:bg-white transition-colors"
        >
          Fit
        </button>
      </div>

      {/* Center: Language Quick Switcher */}
      <div className="relative">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#000000] hover:border-[#1B98F2] disabled:opacity-50 shadow-2xs transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-[#1B98F2]" />
          <span>{currentLangObj.native} ({currentLangObj.label})</span>
        </button>

        {isLangOpen && (
          <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-48 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-1.5 z-40 space-y-0.5 max-h-60 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  if (onLanguageChange) onLanguageChange(lang.code);
                  setIsLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors ${
                  currentLanguage === lang.code
                    ? 'bg-[#E8F3FE] text-[#1B98F2] font-bold'
                    : 'text-[#52525B] hover:bg-[#F6F6F6] hover:text-[#000000]'
                }`}
              >
                <span>{lang.native} • {lang.label}</span>
                {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-[#1B98F2]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Compare & Export Actions */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={onToggleCompare}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
            isCompareMode
              ? 'bg-[#1B98F2] text-white border-[#1B98F2] shadow-xs'
              : 'bg-white text-[#52525B] hover:text-[#09090B] border-[#E5E7EB]'
          }`}
          title="Compare dense policy fine print vs visual synthesis"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Diff Slider</span>
        </button>

        <button
          onClick={onOpenLightbox}
          className="p-1.5 rounded-lg text-[#52525B] hover:text-[#09090B] hover:bg-white transition-colors"
          title="Inspect 1024×1024 150 DPI in Fullscreen Lightbox"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#1B98F2] text-white hover:bg-[#1580CD] text-xs font-bold transition-all shadow-xs"
        >
          <Download className="w-3 h-3" />
          <span>Export 150 DPI</span>
        </button>
      </div>
    </div>
  );
};
