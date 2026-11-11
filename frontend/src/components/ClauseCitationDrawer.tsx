import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, FileText, Bookmark, Sparkles } from 'lucide-react';
import { useToast } from './SerkoToast';

export interface ClauseCitation {
  id: string;
  clauseTitle: string;
  sectionCode: string;
  verbatimText: string;
  irdaiReference: string;
  confidenceScore: number;
  policyDocumentName: string;
  pageNumber: number;
  visualStage: string;
  plainEnglishSummary: string;
}

export const sampleCitations: ClauseCitation[] = [
  {
    id: 'c1',
    clauseTitle: 'Cashless Admission & Pre-Authorization Protocol',
    sectionCode: 'Section 4.1 (Cashless Facility)',
    verbatimText: 'The Insured person shall submit the Pre-Authorization request form along with doctor consultation papers at the hospital insurance desk at least 48 hours prior to planned admission, or within 24 hours of emergency admission. The TPA shall issue Initial Guarantee within 60 minutes of complete document submission.',
    irdaiReference: 'IRDAI Master Circular Ref: IRDAI/HLT/REG/CIR/193/07/2020 Clause 12.3',
    confidenceScore: 99.8,
    policyDocumentName: 'MaxBupa_HealthCompanion_Wording.pdf',
    pageNumber: 14,
    visualStage: 'Step 2: Pre-Auth Desk Submission',
    plainEnglishSummary: 'For emergencies, notify within 24h. The insurer must approve or query your pre-auth within 1 hour under IRDAI guidelines.',
  },
  {
    id: 'c2',
    clauseTitle: 'Inpatient Hospitalization & Room Rent Limit Waiver',
    sectionCode: 'Section 2.1 (Hospitalization Benefits)',
    verbatimText: 'Covered for Single Private Standard A/C Room without proportionate deduction penalty on associated medical expenses. If the Insured occupies a room category higher than eligibility, proportionate deduction shall apply strictly to room charges only and not to surgeon, pharmacy, or diagnostic fees.',
    irdaiReference: 'IRDAI Circular Ref: IRDAI/NL/GDL/MISC/029/01/2024 Rule 8',
    confidenceScore: 99.4,
    policyDocumentName: 'MaxBupa_HealthCompanion_Wording.pdf',
    pageNumber: 8,
    visualStage: 'Hospitalization Coverage Gauge: 100% Inpatient',
    plainEnglishSummary: 'No penalty on doctor or medicine bills if room charges stay within single standard A/C room category.',
  },
  {
    id: 'c3',
    clauseTitle: 'Day Care Procedures & Modern Treatments',
    sectionCode: 'Section 3.4 (Modern Treatment Methods)',
    verbatimText: 'Covers 586 Day Care Procedures requiring less than 24 hours hospital stay due to technological advancement, including robotic surgeries, oral chemotherapy, peritoneal dialysis, and stem cell therapy up to Sum Insured limits.',
    irdaiReference: 'IRDAI Health Guidelines 2020 - Sub-clause 3.4.1',
    confidenceScore: 98.9,
    policyDocumentName: 'MaxBupa_HealthCompanion_Wording.pdf',
    pageNumber: 19,
    visualStage: 'Day Care Benefits: 586+ Procedures (0h Stay)',
    plainEnglishSummary: 'Treatments like chemotherapy and cataract surgeries are covered even without 24 hours hospital admission.',
  },
];

interface ClauseCitationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCitationId?: string;
}

export const ClauseCitationDrawer: React.FC<ClauseCitationDrawerProps> = ({
  isOpen,
  onClose,
  selectedCitationId,
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string>(selectedCitationId || sampleCitations[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCitation =
    sampleCitations.find((c) => c.id === activeId) || sampleCitations[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Clause text copied to clipboard', {
      type: 'success',
      description: currentCitation.sectionCode,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel (Serko styling) */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-[#EBEBEB]">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#EBEBEB] flex items-center justify-between bg-[#FBFBFB]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3FE] flex items-center justify-center text-[#1B98F2]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#000000] tracking-tight">IRDAI Clause Citation Inspector</h3>
                <span className="text-[10px] font-bold text-[#17510B] bg-[#C0F2B5] px-2 py-0.5 rounded-full">
                  Verified Grounding
                </span>
              </div>
              <p className="text-xs text-[#71717A]">Verbatim policy extract deterministic audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/[0.06] text-[#71717A] hover:text-[#000000] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clause Selector Tabs */}
        <div className="px-6 py-3 border-b border-[#EBEBEB] bg-white flex gap-2 overflow-x-auto">
          {sampleCitations.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeId === item.id
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'bg-[#F6F6F6] text-[#71717A] hover:text-[#000000]'
              }`}
            >
              {item.clauseTitle.split(' ')[0]} {item.clauseTitle.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Citation Card */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[#71717A] mb-1">
                <span className="font-mono uppercase tracking-wider">{currentCitation.sectionCode}</span>
                <span className="font-semibold text-[#158142]">{currentCitation.confidenceScore}% Confidence</span>
              </div>
              <h2 className="text-base font-bold text-[#000000] tracking-tight">
                {currentCitation.clauseTitle}
              </h2>
            </div>

            {/* Document Source Metadata */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#F6F6F6] rounded-xl border border-[#E5E7EB] text-xs">
              <span className="flex items-center gap-1 font-medium text-[#000000]">
                <FileText className="w-3.5 h-3.5 text-[#1B98F2]" />
                {currentCitation.policyDocumentName}
              </span>
              <span className="text-[#D4D4D8]">•</span>
              <span className="text-[#71717A]">Page {currentCitation.pageNumber}</span>
              <span className="text-[#D4D4D8]">•</span>
              <span className="text-[#1B98F2] font-medium">{currentCitation.visualStage}</span>
            </div>

            {/* Plain English Translation */}
            <div className="p-4 bg-[#E8F3FE]/50 rounded-xl border border-[#1B98F2]/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B98F2]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customer Plain-English Translation</span>
              </div>
              <p className="text-xs text-[#000000] leading-relaxed font-medium">
                {currentCitation.plainEnglishSummary}
              </p>
            </div>

            {/* Verbatim Legal Policy Text Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
                  Verbatim Underwriter Clause
                </label>
                <button
                  onClick={() => handleCopy(currentCitation.verbatimText)}
                  className="flex items-center gap-1 text-xs text-[#1B98F2] hover:text-[#158142] font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#158142]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Clause'}</span>
                </button>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] text-xs text-[#27272A] leading-relaxed font-serif bg-slate-50/50">
                "{currentCitation.verbatimText}"
              </div>
            </div>

            {/* IRDAI Regulatory Grounding Card */}
            <div className="p-4 bg-[#F6F6F6] rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#FF8C51]" />
                <h4 className="text-xs font-bold text-[#000000]">Regulatory Grounding</h4>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                {currentCitation.irdaiReference}
              </p>
              <div className="text-[11px] text-[#71717A] flex items-center gap-1">
                <span>Deterministic compliance check: Passed IRDAI standard guidelines.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#EBEBEB] bg-[#FBFBFB] flex items-center justify-between gap-3">
          <button
            onClick={() => handleCopy(currentCitation.verbatimText)}
            className="flex-1 py-2.5 px-4 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Excerpt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#000000] text-white text-xs font-semibold hover:bg-black/90 transition-all text-center shadow-sm"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
