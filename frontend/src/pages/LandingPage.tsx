import React, { useState, useRef } from 'react';
import {
  ArrowRight, Play, Pause, Download, Check
} from 'lucide-react';

interface LandingPageProps {
  onEnterStudio: () => void;
  onSignIn?: () => void;
  onRegister?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterStudio,
  onSignIn,
  onRegister,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSample, setActiveSample] = useState<'care' | 'star'>('care');
  const [viewMode, setViewMode] = useState<'video' | 'visual'>('video');

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const sampleData = {
    care: {
      title: 'Care Optima Health Insurance',
      type: 'Individual Comprehensive Schedule',
      policyNo: 'POL-HLT-2026-981249',
      sumInsured: '₹ 15,00,000',
      waitingPeriod: '30 Days Initial',
      pedClause: '36 Months Pre-Existing Disease',
      excerpt: `Section 4.1 Initial Waiting Period: A mandatory waiting period of 30 days from the commencement date shall apply, except in cases of accidental injury.
Section 4.2 Pre-Existing Conditions: Medical conditions declared or diagnosed prior to policy inception are subject to a 36-month waiting period before coverage applies.
Section 7.1 Cashless Claims: Intimation must be submitted to the Network Hospital TPA desk at least 48 hours prior for planned admissions, or within 24 hours for emergency hospitalizations.`,
      pdfUrl: '/Care_Optima_Health_Insurance_Policy.pdf',
    },
    star: {
      title: 'Star Comprehensive Health Floater',
      type: 'Family Floater (4 Members)',
      policyNo: 'POL-FAM-2026-440912',
      sumInsured: '₹ 25,00,000',
      waitingPeriod: '30 Days Initial',
      pedClause: '24 Months Pre-Existing Disease',
      excerpt: `Section 3.1 Sum Insured Floater: Aggregate coverage of ₹25,00,000 applies across Primary Insured, Spouse, and two Dependent Children.
Section 5.2 Automatic Restoration: 100% of the Basic Sum Insured is reinstated once per policy period upon complete exhaustion.
Section 8.3 Cashless Network: Pre-authorization requests processed via Network Hospital Desk within 2 hours of document receipt.`,
      pdfUrl: '/Star_Comprehensive_Family_Health_Policy.pdf',
    },
  };

  const currentDoc = sampleData[activeSample];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 font-sans">
      {/* ── Editorial Header Bar ── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and Positioning */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1">
                <span>IRDAI Regulatory Architecture</span>
                <span className="text-slate-400">•</span>
                <span className="text-orange-700 font-bold">PolicyVision Studio 2.0</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
                Insurance policies, <br />
                translated into visual clarity.
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Convert dense 50-page legal contracts into verified, plain-language visual explainers across Inclusions, Exclusions, and Cashless Claims. Every visual is 100% grounded in source text with verifiable clause citations.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onRegister || onEnterStudio}
                  className="btn-accent px-6 py-3.5 text-sm font-semibold shadow-sm hover:shadow"
                >
                  <span>Launch Policy Studio</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>

                <button
                  onClick={onSignIn || onEnterStudio}
                  className="btn-secondary px-5 py-3.5 text-sm font-semibold"
                >
                  <span>Sign In</span>
                </button>

                <a
                  href="#workbench"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors ml-2"
                >
                  View Sample Policy Breakdown ↓
                </a>
              </div>

              {/* Verified Technical Telemetry */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Document Grounded</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1024×1024 150 DPI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>8 Indic Languages</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PyMuPDF Engine</span>
                </div>
              </div>
            </div>

            {/* Right Column: Key Diagnostic Summary Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      PV
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Verification Spec</div>
                      <div className="text-[11px] text-slate-500">Document Parsing &amp; Synthesis</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    ACTIVE STANDARDS
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Decomposition</span>
                    <span className="text-slate-900 font-semibold">3 Mandatory Invariants</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Reading Level</span>
                    <span className="text-slate-900 font-semibold">Grade 6.8 (Flesch-Kincaid)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Vector Grounding</span>
                    <span className="text-slate-900 font-semibold">0.15 Cosine Similarity Floor</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Output Standard</span>
                    <span className="text-slate-900 font-semibold">1024×1024 PNG / XMP Metadata</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Session Privacy</span>
                    <span className="text-slate-900 font-semibold">4-Hour Automatic Purge</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onEnterStudio}
                  className="w-full btn-primary text-xs py-2.5"
                >
                  Open Studio Dropzone
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Policy Decomposition Workbench ── */}
      <section id="workbench" className="max-w-7xl mx-auto px-6 sm:px-12 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">
              Interactive Workbench
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Contract Text vs Verified Visual Synthesis
            </h2>
          </div>

          {/* Sample Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSample('care')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSample === 'care'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Care Optima (Individual)
            </button>
            <button
              type="button"
              onClick={() => setActiveSample('star')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSample === 'star'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Star Comprehensive (Floater)
            </button>
          </div>
        </div>

        {/* The Split Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Policy Schedule Contract Excerpt */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{currentDoc.title}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentDoc.policyNo}</p>
              </div>
              <a
                href={currentDoc.pdfUrl}
                download
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                title="Download original test policy PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>PDF</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Sum Insured</span>
                <span className="font-bold text-slate-900 text-sm">{currentDoc.sumInsured}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">PED Waiting</span>
                <span className="font-bold text-slate-900 text-sm">{currentDoc.pedClause}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Raw Policy Schedule Clauses
              </div>
              <div className="bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-xl leading-relaxed whitespace-pre-line border border-slate-800 shadow-inner max-h-60 overflow-y-auto">
                {currentDoc.excerpt}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onEnterStudio}
                className="w-full btn-accent text-xs py-2.5"
              >
                Load this Policy into Studio
              </button>
            </div>
          </div>

          {/* Right Side: Visual Explainer / Live Video Preview */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900">Visual Synthesis Output</h3>
                <span className="text-xs font-mono text-slate-400">(1024×1024 Grounded)</span>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('video')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'video' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Loop Video
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'visual' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Infographic
                </button>
              </div>
            </div>

            {/* Display Viewport */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[16/10] flex items-center justify-center">
              {viewMode === 'video' ? (
                <>
                  <video
                    ref={videoRef}
                    src="/policyvision_demo.mp4"
                    poster="/clean_policy_infographic.png"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:text-orange-400 border border-white/10 transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  </div>
                </>
              ) : (
                <img
                  src="/clean_policy_infographic.png"
                  alt="Verified Policy Infographic"
                  className="w-full h-full object-contain bg-slate-900"
                />
              )}

              {/* Citation Footer Pill */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 text-xs text-white flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-semibold">Citations:</span>
                  <span className="text-slate-300">Section 4.1, 4.2 &amp; Section 7.1</span>
                </div>
                <span className="text-emerald-400 font-bold">100% Grounded</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">3 Sections</div>
                <div className="text-[11px] text-slate-500">Covered / Excluded / Claim</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">&lt; 3.0s</div>
                <div className="text-[11px] text-slate-500">Synthesis Latency</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">150 DPI</div>
                <div className="text-[11px] text-slate-500">XMP Metadata Embedded</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-Stage Architectural Pipeline (De-slopped: Sequential, Functional) ── */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">
              Pipeline Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Deterministic Processing, Zero Free-Form Diffusion
            </h2>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              Every stage of PolicyVision AI is bounded by deterministic rules, regulatory compliance checks, and exact passage grounding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="font-mono text-xs font-bold text-orange-600">STAGE 01</div>
              <h3 className="font-bold text-slate-900 text-base">PyMuPDF Ingestion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts raw tokens, policy tables, and schedules from files up to 50 MB, with an OCR hook for scanned contracts.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="font-mono text-xs font-bold text-orange-600">STAGE 02</div>
              <h3 className="font-bold text-slate-900 text-base">Three-Section Invariant</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deconstructs clauses into the mandatory plain-language IRDAI format: What is Covered, What is Not Covered, and Claim Steps.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="font-mono text-xs font-bold text-orange-600">STAGE 03</div>
              <h3 className="font-bold text-slate-900 text-base">Infographic Compiler</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Renders publication-ready 1024×1024 graphics with verified typography, exact waiting period charts, and claim workflows.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="font-mono text-xs font-bold text-orange-600">STAGE 04</div>
              <h3 className="font-bold text-slate-900 text-base">Grounded Vector Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cosine similarity scoring strictly enforces a 0.15 threshold to eliminate ungrounded claims or hallucinated coverage terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ready to Test Action Strip ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Test with Included IRDAI Policy Schedules
            </h2>
            <p className="text-slate-400 text-sm">
              Use the built-in Care Optima or Star Health floater documents to test the ingestion, RAG questions, and visual generator immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onEnterStudio}
              className="btn-accent px-6 py-3 text-sm font-semibold"
            >
              Enter Studio
            </button>
          </div>
        </div>
      </section>

      {/* ── Institutional Footer ── */}
      <footer className="border-t border-slate-200 py-8 px-6 sm:px-12 bg-white text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">PolicyVision AI</span>
            <span>•</span>
            <span>IRDAI Regulatory Architecture</span>
          </div>

          <div className="flex items-center gap-6">
            <span>150 DPI Standard</span>
            <span>8 Indic Scripts</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
