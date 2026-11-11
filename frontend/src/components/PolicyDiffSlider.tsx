import React, { useState, useRef } from 'react';
import { ArrowLeftRight, Check, AlertCircle, Sparkles, SlidersHorizontal, Eye } from 'lucide-react';

interface PolicyDiffSliderProps {
  onOpenViewer?: () => void;
}

export const PolicyDiffSlider: React.FC<PolicyDiffSliderProps> = ({ onOpenViewer }) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [activeVisual, setActiveVisual] = useState<'claims' | 'coverage'>('claims');
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBEBEB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#1B98F2] bg-[#E8F3FE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Interactive Transformation
            </span>
            <span className="text-xs text-[#71717A]">•</span>
            <span className="text-xs text-[#71717A] font-medium">IRDAI Clarity Standard</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#000000] tracking-tight">
            Dense Fine Print vs. Visual Synthesis
          </h3>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2.5">
          {/* Visual Selector */}
          <div className="flex bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB]">
            <button
              onClick={() => setActiveVisual('claims')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeVisual === 'claims'
                  ? 'bg-white text-[#000000] shadow-[0_2px_6px_rgba(0,0,0,0.08)]'
                  : 'text-[#71717A] hover:text-[#000000]'
              }`}
            >
              Claims Flowchart
            </button>
            <button
              onClick={() => setActiveVisual('coverage')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeVisual === 'coverage'
                  ? 'bg-white text-[#000000] shadow-[0_2px_6px_rgba(0,0,0,0.08)]'
                  : 'text-[#71717A] hover:text-[#000000]'
              }`}
            >
              Coverage Infographic
            </button>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === 'slider' ? 'sideBySide' : 'slider')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#52525B] hover:text-[#000000] bg-[#F6F6F6] hover:bg-[#EAEAEA] border border-[#E5E7EB] transition-colors flex items-center gap-1.5"
            title="Toggle View Mode"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{viewMode === 'slider' ? 'Side-by-Side' : 'Split Slider'}</span>
          </button>
        </div>
      </div>

      {/* Main Diff Display Container */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative h-[480px] w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-[#E5E7EB] shadow-inner bg-[#FBFBFB]"
        >
          {/* Left Side: Dense Insurance Wording (Behind / Full Width) */}
          <div className="absolute inset-0 p-6 sm:p-8 bg-[#FAFAFA] flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>BEFORE: 40-Page Legalese Clause (Unintelligible to 84% Policyholders)</span>
              </div>
              <h4 className="text-sm font-serif font-bold text-gray-800 leading-snug">
                SECTION 4.2.1 — SUB-LIMITATIONS, PROPORTIONATE EXPENSE ALLOCATION & ADMISSIBILITY MATRIX
              </h4>
              <p className="text-xs font-serif text-gray-600 leading-relaxed">
                "Subject to the terms, conditions, warranties and exclusions contained herein or endorsed hereon, if during the Policy Period the Insured Person shall contract any illness or sustain any injury and if such illness or injury shall require the Insured Person to undergo hospitalization... then the Company will pay the reasonable and customary medical expenses... Provided always that if the Insured occupies a room category higher than single standard A/C room, a proportionate deduction factor (PDF = RC_allowed / RC_actual) shall be levied across all associated medical expenses including surgeon charges, OT fees, nursing expenses, diagnostics and pre/post hospitalization..."
              </p>
              <div className="p-3 bg-red-50/80 rounded-lg border border-red-200 text-[11px] text-red-800 space-y-1 font-mono">
                <div>• Proportionate deduction ambiguity: Over ₹1,40,000 unexpected co-pay penalty.</div>
                <div>• TPA approval delay window: Unclear documentation checklist causing claim rejection.</div>
                <div>• Exclusions buried in footnote 17 on page 38.</div>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 font-mono">
              Source: Standard Underwriter Policy Wordings · Form No. IRDAI/HLT/2021/V4
            </div>
          </div>

          {/* Right Side: PolicyVision Explainer Visual (Clipped via clipPath) */}
          <div
            className="absolute inset-0 bg-white"
            style={{
              clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#F8FAFC]">
              <img
                src={
                  activeVisual === 'claims'
                    ? '/claims_flowchart_explainer.png'
                    : '/coverage_infographic_explainer.png'
                }
                alt="PolicyVision AI Visual Explainer"
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-[#E2E8F0]"
              />
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C0F2B5] text-[#17510B] text-xs font-bold shadow-sm">
                <Check className="w-3.5 h-3.5" />
                <span>AFTER: PolicyVision Visual Explainer (150 DPI · IRDAI Grounded)</span>
              </div>
            </div>
          </div>

          {/* Drag Handle Bar */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-[#1B98F2] shadow-[0_0_12px_rgba(27,152,242,0.8)] flex items-center justify-center pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-9 h-9 rounded-full bg-white border-2 border-[#1B98F2] shadow-xl flex items-center justify-center text-[#1B98F2]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dense Clause Card */}
          <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-red-200/80 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>BEFORE: Dense Underwriter Document</span>
            </div>
            <h4 className="text-sm font-serif font-bold text-gray-800">
              SECTION 4.2 — CLAIMS ADMISSIBILITY & PROPORTIONATE DEDUCTIONS
            </h4>
            <p className="text-xs font-serif text-gray-600 leading-relaxed">
              "The Company shall be under no liability to make payment in respect of any claim under this Policy unless the Insured Person or his representative shall give written notice to the Third Party Administrator within twenty-four (24) hours of the occurrence of any event giving rise to a claim... If room category exceeds standard A/C room, proportionate reduction applies to all associated medical expenses."
            </p>
            <div className="p-3 bg-red-50 rounded-xl text-xs text-red-800 space-y-1 font-mono">
              <div className="font-bold">Key Friction Points:</div>
              <div>• 72% claim disputes stem from room rent sub-limit ignorance.</div>
              <div>• TPA rejection due to missing step-by-step intimation timeline.</div>
            </div>
          </div>

          {/* Visual Explainer Card */}
          <div className="p-6 bg-white rounded-2xl border border-[#C0F2B5] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C0F2B5] text-[#17510B] text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>AFTER: PolicyVision Explainer Visual</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F8FAFC] p-2 flex items-center justify-center">
                <img
                  src={
                    activeVisual === 'claims'
                      ? '/claims_flowchart_explainer.png'
                      : '/coverage_infographic_explainer.png'
                  }
                  alt="Visual Explainer"
                  className="max-h-64 object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#71717A] pt-2 border-t border-[#EBEBEB]">
              <span className="font-semibold text-[#158142]">99.8% Comprehension Rate</span>
              <span>1024×1024 150 DPI Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Explainer Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#71717A] gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1B98F2]" />
          <span>
            Drag the blue handle horizontally or switch to <strong>Side-by-Side</strong> to inspect difference.
          </span>
        </div>
        {onOpenViewer && (
          <button
            onClick={onOpenViewer}
            className="text-[#000000] hover:text-[#1B98F2] font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Open in Visual Studio</span>
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
