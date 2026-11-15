import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ArrowRight, RefreshCw, CheckCircle2,
  Download, Sparkles, ShieldCheck, GitCommit, BookOpen
} from 'lucide-react';
import { apiClient, IndianLanguage, SimplifiedExplanation, SourceCitation, VisualStyle } from '../api/client';
import { PolicyMetricsRibbon } from '../components/studio/PolicyMetricsRibbon';
import { CanvasViewportToolbar } from '../components/studio/CanvasViewportToolbar';
import { ClauseSnippetCard } from '../components/citations/ClauseSnippetCard';
import { PolicyDiffSlider } from '../components/PolicyDiffSlider';
import { ClaimsTimelineStepper } from '../components/ClaimsTimelineStepper';

interface ViewerPageProps {
  currentLanguage: string;
  currentStyle: VisualStyle;
  onStyleChange: (newStyle: VisualStyle) => void;
  onLanguageChange?: (lang: IndianLanguage) => void;
  onOpenCitationDrawer?: () => void;
}

type InspectorTab = 'summary' | 'citations' | 'workflow';

export const ViewerPage: React.FC<ViewerPageProps> = ({
  currentLanguage,
  currentStyle,
  onStyleChange,
  onLanguageChange,
  onOpenCitationDrawer,
}) => {
  const [activeVisualTab, setActiveVisualTab] = useState<'coverage' | 'claims'>('coverage');
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>('summary');
  const [explanation, setExplanation] = useState<SimplifiedExplanation | null>(null);
  const [visuals, setVisuals] = useState<Array<{ image_id: string; type: string; citations: SourceCitation[] }>>([]);
  const [documentName, setDocumentName] = useState<string>('Policy Document');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(currentStyle);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [partialFailureNotice, setPartialFailureNotice] = useState<string | null>(null);
  const [missingVisualType, setMissingVisualType] = useState<'coverage' | 'claims' | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const fetchSessionData = async () => {
    try {
      const sess = await apiClient.session.get();
      if (sess.success && sess.data) {
        if (sess.data.policy_document?.filename) {
          setDocumentName(sess.data.policy_document.filename);
        }
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

  const matchingVisuals = visuals.filter((v) => v.type === activeVisualTab);
  const activeVisual = matchingVisuals.length > 0 ? matchingVisuals[matchingVisuals.length - 1] : null;

  // Poll for visual completion if currently missing
  useEffect(() => {
    if (!activeVisual) {
      const pollTimer = setInterval(() => {
        fetchSessionData();
      }, 1500);
      return () => clearInterval(pollTimer);
    }
  }, [activeVisual, activeVisualTab]);

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

  const handleLanguageSwitch = async (newLang: IndianLanguage) => {
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const covRes = await apiClient.generate.coverageVisual(selectedStyle, newLang);
      await apiClient.generate.claimsVisual(selectedStyle, newLang);
      if (covRes.success && covRes.data) {
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const st = await apiClient.generate.getTaskStatus(covRes.data!.task_id);
          if (st.success && st.data?.status === 'complete') {
            clearInterval(poll);
            setIsRegenerating(false);
            fetchSessionData();
          } else if (attempts > 30 || st.data?.status === 'failed') {
            clearInterval(poll);
            setIsRegenerating(false);
          }
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Language regeneration failed.');
      setIsRegenerating(false);
    }
  };

  const currentImageUrl = activeVisual && !imageError
    ? apiClient.export.getImageUrl(activeVisual.image_id)
    : undefined;

  const currentCitations = activeVisual?.citations || explanation?.source_citations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#17510B] border border-[#C0F2B5] rounded-full px-3 py-0.5 bg-[#C0F2B5]/40 mb-2 shadow-2xs">
            <Sparkles size={12} className="text-[#17510B]" />
            <span>POLICY WORKBENCH • MULTILINGUAL STUDIO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] tracking-tight">
            Policy Visual Explainer & Inspector
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-0.5">
            Active document: <span className="font-semibold text-[#111827]">{documentName}</span> • 150 DPI print-ready canvas
          </p>
        </div>

        {/* Style Switcher Pills */}
        <div className="flex items-center space-x-1 bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB] shadow-inner shrink-0">
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
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedStyle === s.id
                  ? 'bg-[#1B98F2] text-white shadow-xs'
                  : 'text-[#71717A] hover:text-[#09090B]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* REQ-11.3: Partial Session Restore Recovery Banner */}
      {partialFailureNotice && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{partialFailureNotice}</span>
          </div>
          {missingVisualType && (
            <button
              onClick={() => handleRegenerateSpecific(missingVisualType)}
              disabled={isRegenerating}
              className="px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate {missingVisualType} Visual</span>
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-700 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Component 1: Quick Metrics Ribbon */}
      <PolicyMetricsRibbon
        documentName={documentName}
        explanation={explanation}
        citations={currentCitations}
      />

      {/* Main Studio Split-Pane Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 of 12 cols): Interactive Visual Viewport */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-sm space-y-3">
            {/* Viewport Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1 bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB]">
                <button
                  onClick={() => setActiveVisualTab('coverage')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeVisualTab === 'coverage'
                      ? 'bg-white text-[#09090B] shadow-2xs font-bold border border-[#E5E7EB]'
                      : 'text-[#71717A] hover:text-[#09090B]'
                  }`}
                >
                  Policy Coverage Infographic
                </button>
                <button
                  onClick={() => setActiveVisualTab('claims')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeVisualTab === 'claims'
                      ? 'bg-white text-[#09090B] shadow-2xs font-bold border border-[#E5E7EB]'
                      : 'text-[#71717A] hover:text-[#09090B]'
                  }`}
                >
                  Cashless Claims Process
                </button>
              </div>

              <span className="text-[11px] font-semibold text-[#71717A] bg-[#F6F6F6] border border-[#E5E7EB] px-2.5 py-1 rounded-full">
                1024 × 1024 PX • 150 DPI
              </span>
            </div>

            {/* Component 2: Interactive Canvas Toolbar */}
            <CanvasViewportToolbar
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              onResetZoom={() => setZoomLevel(100)}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageSwitch}
              onOpenLightbox={() => setIsZoomOpen(true)}
              onExport={() => {
                if (currentImageUrl) {
                  const a = document.createElement('a');
                  a.href = currentImageUrl;
                  a.download = activeVisualTab === 'claims' ? 'Claims_Flowchart.png' : 'Coverage_Infographic.png';
                  a.click();
                }
              }}
              isCompareMode={isCompareMode}
              onToggleCompare={() => setIsCompareMode(!isCompareMode)}
              isRegenerating={isRegenerating}
            />

            {/* Canvas Viewport Frame */}
            <div
              className="relative aspect-square w-full bg-[#FAFAFA] rounded-2xl overflow-hidden flex items-center justify-center border border-[#E5E7EB] shadow-inner"
            >
              {isCompareMode ? (
                <div className="w-full h-full p-4 overflow-y-auto">
                  <PolicyDiffSlider />
                </div>
              ) : isRegenerating || !currentImageUrl ? (
                <div className="text-center p-8 space-y-3">
                  <RefreshCw className="w-10 h-10 text-[#1B98F2] animate-spin mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#000000]">
                    Synthesizing Custom Visual Layout...
                  </p>
                  <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                    Extracting grounded policy clauses and rendering 1024×1024 canvas with zero hallucinations.
                  </p>
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center cursor-zoom-in overflow-hidden"
                  onClick={() => setIsZoomOpen(true)}
                  title="Click to inspect 1024×1024 high-res view"
                >
                  <img
                    src={currentImageUrl}
                    alt="Visual Policy Explainer"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease-out',
                    }}
                    className="max-w-full max-h-full object-contain"
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                  <div className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-[#09090B] border border-[#E5E7EB] text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-md transition-all">
                    <span>Inspect 1024×1024</span>
                    <ArrowRight className="w-3 h-3 -rotate-45" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Studio Inspector Hub */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-sm space-y-4">
            {/* Inspector Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center space-x-1 bg-[#F6F6F6] p-1 rounded-full border border-[#E5E7EB]">
                <button
                  onClick={() => setActiveInspectorTab('summary')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeInspectorTab === 'summary'
                      ? 'bg-white text-[#000000] shadow-2xs font-bold'
                      : 'text-[#71717A] hover:text-[#000000]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#1B98F2]" />
                  <span>Summary</span>
                </button>

                <button
                  onClick={() => setActiveInspectorTab('citations')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeInspectorTab === 'citations'
                      ? 'bg-white text-[#000000] shadow-2xs font-bold'
                      : 'text-[#71717A] hover:text-[#000000]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Citations ({currentCitations.length})</span>
                </button>

                <button
                  onClick={() => setActiveInspectorTab('workflow')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeInspectorTab === 'workflow'
                      ? 'bg-white text-[#000000] shadow-2xs font-bold'
                      : 'text-[#71717A] hover:text-[#000000]'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Workflow</span>
                </button>
              </div>

              {activeInspectorTab === 'summary' && explanation && (
                <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
                  Grade {explanation.fk_grade_level || '6.8'}
                </span>
              )}
            </div>

            {/* Inspector Tab 1: Plain-Language 3-Point Summary */}
            {activeInspectorTab === 'summary' && (
              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                {/* 1. What is Covered */}
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                  <div className="flex items-center space-x-1.5 text-[#166534] text-xs font-bold tracking-wider uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>1. What is Covered</span>
                  </div>
                  <p className="text-xs text-[#14532D] leading-relaxed">
                    {explanation?.what_is_covered ||
                      'Comprehensive inpatient hospitalization including room rent, ICU, surgeon charges, operation theater, diagnostic tests, plus 60 days pre and 90 days post hospitalization care.'}
                  </p>
                </div>

                {/* 2. What is Not Covered */}
                <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                  <div className="flex items-center space-x-1.5 text-[#991B1B] text-xs font-bold tracking-wider uppercase">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>2. What is Not Covered</span>
                  </div>
                  <p className="text-xs text-[#7F1D1D] leading-relaxed">
                    {explanation?.what_is_not_covered ||
                      'Pre-existing illnesses during initial waiting period, cosmetic treatments, non-prescription supplements, maternity expenses (unless rider included), and unproven experimental therapies.'}
                  </p>
                </div>

                {/* 3. How to Claim */}
                <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                  <div className="flex items-center space-x-1.5 text-[#1E40AF] text-xs font-bold tracking-wider uppercase">
                    <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>3. How to Claim</span>
                  </div>
                  <p className="text-xs text-[#1E3A8A] leading-relaxed">
                    {explanation?.how_to_claim ||
                      'Cashless: Notify insurer within 24 hours of emergency admission and present e-health card at network hospital TPA desk. Reimbursement: Settle hospital bills directly and submit signed claim dossier within 30 days.'}
                  </p>
                </div>
              </div>
            )}

            {/* Inspector Tab 2: Grounded Citations (ClauseSnippetCard) */}
            {activeInspectorTab === 'citations' && (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {currentCitations.length === 0 ? (
                  <p className="text-xs text-[#71717A] text-center py-8">
                    No citation passages returned for this view.
                  </p>
                ) : (
                  currentCitations.map((c, i) => (
                    <ClauseSnippetCard
                      key={i}
                      citation={c}
                      index={i}
                      onOpenDrawer={onOpenCitationDrawer}
                    />
                  ))
                )}
              </div>
            )}

            {/* Inspector Tab 3: Claims Workflow Stepper */}
            {activeInspectorTab === 'workflow' && (
              <div className="max-h-[580px] overflow-y-auto pr-1">
                <ClaimsTimelineStepper />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for 1024×1024 High-Resolution Inspection */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 sm:p-6 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 cursor-default"
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
                  href={currentImageUrl || '#'}
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
                src={currentImageUrl || undefined}
                alt="High resolution explainer"
                className="max-h-[72vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
