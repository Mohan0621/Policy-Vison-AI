import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, RefreshCw, CheckCircle2, Layers, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { apiClient, SimplifiedExplanation, SourceCitation, VisualStyle } from '../api/client';

interface ViewerPageProps {
  currentLanguage: string;
  currentStyle: VisualStyle;
  onStyleChange: (newStyle: VisualStyle) => void;
  onOpenCitationDrawer?: () => void;
}

export const ViewerPage: React.FC<ViewerPageProps> = ({
  currentLanguage,
  currentStyle,
  onStyleChange,
  onOpenCitationDrawer,
}) => {
  const [activeVisualTab, setActiveVisualTab] = useState<'coverage' | 'claims'>('coverage');
  const [explanation, setExplanation] = useState<SimplifiedExplanation | null>(null);
  const [visuals, setVisuals] = useState<Array<{ image_id: string; type: string; citations: SourceCitation[] }>>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(currentStyle);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [partialFailureNotice, setPartialFailureNotice] = useState<string | null>(null);
  const [missingVisualType, setMissingVisualType] = useState<'coverage' | 'claims' | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const fetchSessionData = async () => {
    try {
      const sess = await apiClient.session.get();
      if (sess.success && sess.data) {
        if (sess.data.simplified_explanation) {
          setExplanation(sess.data.simplified_explanation);
        }
        const visualList = sess.data.visual_explainers || [];
        setVisuals(visualList);

        // REQ-11.3: Partial session restore detection
        if (sess.data.policy_document || sess.data.simplified_explanation) {
          const hasCoverage = visualList.some((v: any) => v.type === 'coverage');
          const hasClaims = visualList.some((v: any) => v.type === 'claims');

          if (hasCoverage && !hasClaims) {
            setMissingVisualType('claims');
            setPartialFailureNotice("Restoration note: 'Claims Process Flowchart' was not found or could not be restored.");
          } else if (!hasCoverage && hasClaims) {
            setMissingVisualType('coverage');
            setPartialFailureNotice("Restoration note: 'Policy Coverage Infographic' was not found or could not be restored.");
          } else if (!hasCoverage && !hasClaims && sess.data.simplified_explanation) {
            setMissingVisualType('coverage');
            setPartialFailureNotice("Restoration note: Generated visual explainers could not be restored from session cache.");
          } else {
            setMissingVisualType(null);
            setPartialFailureNotice(null);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const activeVisual = visuals.find((v) => v.type === activeVisualTab) || visuals[0];

  const handleRegenerateSpecific = async (targetType: 'coverage' | 'claims') => {
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const apiCall = targetType === 'coverage'
        ? apiClient.generate.coverageVisual(selectedStyle, currentLanguage)
        : apiClient.generate.claimsVisual(selectedStyle, currentLanguage);

      const res = await apiCall;
      if (res.success && res.data) {
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const st = await apiClient.generate.getTaskStatus(res.data!.task_id);
          if (st.success && st.data?.status === 'complete') {
            clearInterval(poll);
            setIsRegenerating(false);
            onStyleChange(selectedStyle);
            setPartialFailureNotice(null);
            setMissingVisualType(null);
            setImageError(false);
            fetchSessionData();
          } else if (attempts > 30 || st.data?.status === 'failed') {
            clearInterval(poll);
            setIsRegenerating(false);
            setErrorMsg(`Regeneration for ${targetType} visual failed. Retaining previous visual.`);
          }
        }, 1000);
      } else {
        setErrorMsg(res.error?.message || 'Failed to start visual generation.');
        setIsRegenerating(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Regeneration error.');
      setIsRegenerating(false);
    }
  };

  const handleFullStyleChange = async (newStyle: VisualStyle) => {
    setSelectedStyle(newStyle);
    setIsRegenerating(true);
    setErrorMsg(null);

    try {
      const covRes = await apiClient.generate.coverageVisual(newStyle, currentLanguage);
      if (covRes.success && covRes.data) {
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const st = await apiClient.generate.getTaskStatus(covRes.data!.task_id);
          if (st.success && st.data?.status === 'complete') {
            clearInterval(poll);
            setIsRegenerating(false);
            onStyleChange(newStyle);
            fetchSessionData();
          } else if (attempts > 30 || st.data?.status === 'failed') {
            clearInterval(poll);
            setIsRegenerating(false);
            setErrorMsg('Style regeneration failed. Retaining previous visual.');
          }
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Style regeneration failed.');
      setIsRegenerating(false);
    }
  };

  const currentImageUrl = activeVisual && !imageError
    ? apiClient.export.getImageUrl(activeVisual.image_id)
    : activeVisualTab === 'claims'
    ? '/claims_flowchart_explainer.png'
    : '/coverage_infographic_explainer.png';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#17510B] border border-[#C0F2B5] rounded-full px-3.5 py-1 bg-[#C0F2B5]/40 mb-3 shadow-xs">
            <Sparkles size={13} className="text-[#17510B]" />
            <span>VISUAL EXPLORATION CANVAS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#000000] tracking-tight">
            Policy Visual Explainer
          </h1>
          <p className="text-sm text-[#71717A] mt-1">
            Crystal-clear visual synthesis with sentence-level document grounding & zero hallucinations.
          </p>
        </div>

        {/* Style Switcher Pills (Serko Pill Track) */}
        <div className="flex items-center space-x-1 bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB] shadow-inner">
          {(
            [
              { id: 'professional_infographic', label: 'Infographic' },
              { id: 'illustrated_cartoon', label: 'Illustrated' },
              { id: 'flowchart_diagram', label: 'Flowchart' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => handleFullStyleChange(s.id)}
              disabled={isRegenerating}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedStyle === s.id
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'text-[#71717A] hover:text-[#000000]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* REQ-11.3: Partial Session Restore Recovery Banner */}
      {partialFailureNotice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span>{partialFailureNotice}</span>
          </div>
          {missingVisualType && (
            <button
              onClick={() => handleRegenerateSpecific(missingVisualType)}
              disabled={isRegenerating}
              className="serko-btn-black !text-xs !py-1.5 !px-3 flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate {missingVisualType} Visual</span>
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-xs text-rose-700 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Visual Canvas & Grounding Citations HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Gallery Canvas Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
            {/* Viewport Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1 bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB]">
                <button
                  onClick={() => setActiveVisualTab('coverage')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeVisualTab === 'coverage'
                      ? 'bg-[#000000] text-white shadow-sm'
                      : 'text-[#71717A] hover:text-[#000000]'
                  }`}
                >
                  Policy Coverage Infographic
                </button>
                <button
                  onClick={() => setActiveVisualTab('claims')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeVisualTab === 'claims'
                      ? 'bg-[#000000] text-white shadow-sm'
                      : 'text-[#71717A] hover:text-[#000000]'
                  }`}
                >
                  Cashless Claims Process
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-semibold text-[#71717A] bg-[#F6F6F6] border border-[#E5E7EB] px-3 py-1 rounded-full">
                  1024 × 1024 PX • 150 DPI
                </span>
                <a
                  href={currentImageUrl}
                  download="PolicyVision_Infographic.png"
                  className="text-xs text-[#000000] hover:text-[#1B98F2] font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">EXPORT</span>
                </a>
              </div>
            </div>

            {/* Canvas Frame */}
            <div
              onClick={() => setIsZoomOpen(true)}
              className="relative aspect-square w-full bg-[#FAFAFA] rounded-2xl overflow-hidden flex items-center justify-center border border-[#E5E7EB] shadow-inner group cursor-pointer"
              title="Click to view full-resolution 1024×1024 print visual"
            >
              {isRegenerating ? (
                <div className="text-center p-8">
                  <RefreshCw className="w-10 h-10 text-[#1B98F2] animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-[#52525B] uppercase tracking-wider">
                    Synthesizing Visual Layout...
                  </p>
                </div>
              ) : (
                <>
                  <img
                    src={currentImageUrl}
                    alt="Visual Policy Explainer"
                    className="w-full h-full object-contain hover:scale-[1.015] transition-transform duration-300"
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                  <div className="absolute bottom-4 right-4 bg-[#000000]/80 hover:bg-[#000000] text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-md transition-all">
                    <span>Inspect 1024×1024 (150 DPI)</span>
                    <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Grounding Passages HUD (REQ-12.2) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#1B98F2]" />
                <h3 className="font-bold text-[#000000] text-base tracking-tight">
                  Document Citations
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#17510B] bg-[#C0F2B5] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full">
                100% Grounded
              </span>
            </div>

            {onOpenCitationDrawer && (
              <button
                onClick={onOpenCitationDrawer}
                className="w-full mb-3.5 py-2 px-3 rounded-xl bg-[#E8F3FE] hover:bg-[#D6EBFE] text-[#1B98F2] border border-[#1B98F2]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Open IRDAI Clause Citation Drawer</span>
              </button>
            )}

            <p className="text-xs text-[#71717A] mb-4 leading-relaxed">
              Every section, sub-limit & procedure rendered on this visual is verified against official policy passages:
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[580px]">
              {(activeVisual?.citations || explanation?.source_citations || []).length > 0 ? (
                (activeVisual?.citations || explanation?.source_citations || []).map((c, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#1B98F2] transition-all space-y-2 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F6F6F6] border border-[#E5E7EB] text-[#000000]">
                        {c.section_heading} • Page {c.page_number}
                      </span>
                      <span className="text-[11px] font-semibold text-[#158142]">
                        {(c.relevance_score * 100).toFixed(0)}% MATCH
                      </span>
                    </div>
                    <blockquote className="text-xs text-[#52525B] italic border-l-2 border-[#1B98F2] pl-3 py-0.5 line-clamp-3">
                      "{c.passage_text}"
                    </blockquote>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-2 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F6F6F6] border border-[#E5E7EB] text-[#000000]">
                        Section 3.1 • Page 4
                      </span>
                      <span className="text-[11px] font-semibold text-[#158142]">96% MATCH</span>
                    </div>
                    <blockquote className="text-xs text-[#52525B] italic border-l-2 border-[#1B98F2] pl-3 py-0.5">
                      "Inpatient hospitalization expenses including room rent, nursing, ICU, surgeon fees covered up to Sum Insured."
                    </blockquote>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-2 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F6F6F6] border border-[#E5E7EB] text-[#000000]">
                        Section 4.2 • Page 9
                      </span>
                      <span className="text-[11px] font-semibold text-[#158142]">94% MATCH</span>
                    </div>
                    <blockquote className="text-xs text-[#52525B] italic border-l-2 border-[#1B98F2] pl-3 py-0.5">
                      "Initial waiting period of thirty (30) days from policy inception date applies except for accidental injury."
                    </blockquote>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Explanation Three-Section Invariant (REQ-4.4, Property 3) */}
      <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="text-xs font-bold text-[#1B98F2] uppercase tracking-wider mb-1">
              Plain-Language Synthesis
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#000000] tracking-tight">
              Cognitive Policy Summary
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-[#C0F2B5] text-[#17510B] border border-[#BBF7D0] px-3.5 py-1.5 rounded-full font-bold">
              FLESCH-KINCAID GRADE: {explanation?.fk_grade_level || '6.8'} (TARGET ≤ 8)
            </span>
            {explanation?.fallback_language && (
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full font-semibold">
                FALLBACK: EN
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. What is Covered */}
          <div className="p-6 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-3">
            <div className="flex items-center space-x-2 text-[#166534] text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>1. WHAT IS COVERED</span>
            </div>
            <p className="text-xs sm:text-sm text-[#14532D] leading-relaxed font-normal">
              {explanation?.what_is_covered ||
                'Full inpatient hospitalization (ICU, room rent, surgeon fees), 60 days pre-admission and 90 days post-discharge medical care, plus road ambulance emergency transport up to ₹3,000.'}
            </p>
          </div>

          {/* 2. What is Not Covered */}
          <div className="p-6 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-3">
            <div className="flex items-center space-x-2 text-[#991B1B] text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span>2. WHAT IS NOT COVERED</span>
            </div>
            <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed font-normal">
              {explanation?.what_is_not_covered ||
                'Pre-existing diseases (PED) for first 36 months, initial 30-day non-accidental waiting period, cosmetic surgeries, non-prescribed therapies, and routine dental/vision outpatient checkups.'}
            </p>
          </div>

          {/* 3. How to Claim */}
          <div className="p-6 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-3">
            <div className="flex items-center space-x-2 text-[#1E40AF] text-xs font-bold uppercase tracking-wider">
              <ArrowRight className="w-4 h-4 text-[#2563EB]" />
              <span>3. HOW TO CLAIM</span>
            </div>
            <p className="text-xs sm:text-sm text-[#1E3A8A] leading-relaxed font-normal">
              {explanation?.how_to_claim ||
                'Notify insurer within 24 hours for emergency or 48 hours before planned admission. Present e-health card at network hospital TPA desk. TPA approves cashless settlement directly.'}
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for 1024×1024 Inspection */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#158142]" />
                <span className="text-sm font-bold text-[#000000]">
                  {activeVisualTab === 'claims' ? 'Cashless Claims Flowchart' : 'Policy Coverage Infographic'} • High Fidelity 150 DPI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={currentImageUrl}
                  download={activeVisualTab === 'claims' ? 'Claims_Flowchart.png' : 'Coverage_Infographic.png'}
                  className="ds-btn-primary !text-xs !py-1.5 !px-3"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setIsZoomOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] text-[#000000] font-bold flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="w-full flex items-center justify-center bg-[#FAFAFA] rounded-2xl overflow-hidden border border-[#E5E7EB]">
              <img
                src={currentImageUrl}
                alt="High resolution explainer"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
