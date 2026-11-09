import React, { useState, useRef } from 'react';
import {
  ArrowRight, Play, Pause, Download, Shield, FileText, Lock
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
  const [activePolicyIndex, setActivePolicyIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'visual' | 'clauses' | 'citations'>('visual');

  const policies = [
    {
      id: 'care-optima',
      name: 'Care Optima Health',
      holder: 'Chaitanya Mohan, 38',
      type: 'Individual Comprehensive Schedule',
      sumInsured: '₹ 15,00,000',
      waitingPeriod: '30 Days Initial',
      pedWaiting: '36 Months Pre-Existing Disease',
      policyNo: 'POL-HLT-2026-981249',
      cashlessWindow: '48h Planned / 24h Emergency',
      status: 'VERIFIED GROUNDED',
      pdfUrl: '/Care_Optima_Health_Insurance_Policy.pdf',
      excerpt: `Section 4.1 Initial Waiting Period: A mandatory waiting period of 30 days from the commencement date shall apply, except in cases of accidental injury.
Section 4.2 Pre-Existing Conditions: Medical conditions declared or diagnosed prior to policy inception are subject to a 36-month waiting period before coverage applies.
Section 7.1 Cashless Claims: Intimation must be submitted to the Network Hospital TPA desk at least 48 hours prior for planned admissions, or within 24 hours for emergency hospitalizations.`,
    },
    {
      id: 'star-comprehensive',
      name: 'Star Comprehensive Floater',
      holder: 'Priya & Ramesh Sharma, 42',
      type: 'Family Floater (4 Members Covered)',
      sumInsured: '₹ 25,00,000',
      waitingPeriod: '30 Days Initial',
      pedWaiting: '24 Months Pre-Existing Disease',
      policyNo: 'POL-FAM-2026-440912',
      cashlessWindow: 'Within 2h via Network Desk',
      status: 'VERIFIED GROUNDED',
      pdfUrl: '/Star_Comprehensive_Family_Health_Policy.pdf',
      excerpt: `Section 3.1 Sum Insured Floater: Aggregate coverage of ₹25,00,000 applies across Primary Insured, Spouse, and two Dependent Children.
Section 5.2 Automatic Restoration: 100% of the Basic Sum Insured is reinstated once per policy period upon complete exhaustion.
Section 8.3 Cashless Network: Pre-authorization requests processed via Network Hospital Desk within 2 hours of document receipt.`,
    },
    {
      id: 'hdfc-optima',
      name: 'HDFC ERGO Optima Secure',
      holder: 'Ananya Deshmukh, 29',
      type: 'Individual Secure Health Policy',
      sumInsured: '₹ 10,00,000',
      waitingPeriod: '30 Days Initial',
      pedWaiting: '36 Months Pre-Existing Disease',
      policyNo: 'POL-HDF-2026-551023',
      cashlessWindow: '24h Network Authorization',
      status: 'SPECIFICATION READY',
      pdfUrl: '/Care_Optima_Health_Insurance_Policy.pdf',
      excerpt: `Section 2.1 2X Base Sum Insured: Automatic 100% additional coverage created instantly on policy issuance from day one.
Section 6.4 Preventative Health Check-up: Annual complimentary health check-up across 200+ network diagnostic centers.
Section 9.1 Day Care Treatments: 500+ day care procedures covered up to Sum Insured without mandatory 24-hour hospitalization.`,
    },
  ];

  const current = policies[activePolicyIndex];

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

  return (
    <div className="min-h-screen bg-[#FCF8EF] text-[#1A1A1E] font-sans selection:bg-[#FF5C00] selection:text-white">
      {/* ── 1. Hero Section (Clinia exact typographical layout) ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 sm:pt-24 pb-16">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#FF5C00] font-semibold">
            <span>PolicyVision Context Engine</span>
            <span className="text-[#CCA44F]">•</span>
            <span>IRDAI Regulatory Standards</span>
          </div>

          <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#1A1A1E] leading-[1.04]">
            Policy data, turned into <br />
            <span className="italic font-normal text-[#FF5C00]">visual clarity.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#53402C] leading-relaxed max-w-2xl font-normal">
            Engineered for policyholders, underwriters, and compliance officers in mission-critical insurance decisions. Transform 50-page complex contracts into 100% document-grounded visual infographics with verifiable clause citations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={onRegister || onEnterStudio}
              className="btn-clinia-vital text-sm font-medium py-3 px-6 shadow-sm hover:shadow"
            >
              <span>Launch Policy Studio</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <button
              onClick={onSignIn || onEnterStudio}
              className="btn-clinia-transparent text-sm font-medium py-3 px-6"
            >
              <span>Sign in to Studio</span>
            </button>

            <a
              href="#policies"
              className="text-xs font-mono uppercase tracking-wider text-[#53402C] hover:text-[#1A1A1E] px-3 py-2 transition-colors"
            >
              Explore sample policies ↓
            </a>
          </div>

          <div className="pt-8 border-t border-[#ECD9B9]/70 flex flex-wrap items-center gap-y-2 gap-x-8 text-xs font-mono text-[#53402C]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" />
              <span>100% DOCUMENT GROUNDED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" />
              <span>1024×1024 150 DPI COMPILER</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" />
              <span>8 INDIC SCRIPTS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" />
              <span>0.15 COSINE THRESHOLD</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Clinia-Style Interactive Document Switcher ("Every policy is unique") ── */}
      <section id="policies" className="border-t border-[#ECD9B9] bg-[#F2EEE5]/60 py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-[#FF5C00] font-semibold mb-2">
                Context Engine Studio
              </div>
              <h2 className="font-editorial text-3xl sm:text-5xl font-normal tracking-tight text-[#1A1A1E]">
                Every insurance policy is unique in its own way
              </h2>
            </div>
            <div className="text-xs font-mono text-[#53402C]">
              Select a schedule to inspect real-time grounding
            </div>
          </div>

          {/* Policy Selector Cards Strip (Mirroring Clinia's Patient Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {policies.map((p, idx) => {
              const isSelected = activePolicyIndex === idx;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePolicyIndex(idx)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white border-[#FF5C00] shadow-md ring-1 ring-[#FF5C00]'
                      : 'bg-white/80 border-[#ECD9B9] hover:border-[#CCA44F] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#95795C]">
                      {p.type}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-[#FF5C00]/10 text-[#FF5C00]'
                          : 'bg-[#F2EEE5] text-[#53402C]'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#53402C] mt-1 font-mono">
                    {p.holder}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#F2EEE5] grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[#95795C] block text-[10px] uppercase">Sum Insured</span>
                      <span className="font-bold text-[#1A1A1E]">{p.sumInsured}</span>
                    </div>
                    <div>
                      <span className="text-[#95795C] block text-[10px] uppercase">PED Waiting</span>
                      <span className="font-bold text-[#1A1A1E]">{p.waitingPeriod}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Inspection Workspace (Clinia's Engine Workbench) */}
          <div className="bg-white rounded-3xl border border-[#ECD9B9] p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F2EEE5] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C00]" />
                  <h3 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
                    {current.name}
                  </h3>
                  <span className="font-mono text-xs text-[#95795C]">({current.policyNo})</span>
                </div>
                <p className="text-xs text-[#53402C] mt-0.5 font-mono">
                  {current.holder} • Cashless Desk: {current.cashlessWindow}
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === 'visual'
                      ? 'bg-[#1A1A1E] text-white font-bold'
                      : 'bg-[#F2EEE5] text-[#53402C] hover:text-[#1A1A1E]'
                  }`}
                >
                  Visual Explainer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clauses')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === 'clauses'
                      ? 'bg-[#1A1A1E] text-white font-bold'
                      : 'bg-[#F2EEE5] text-[#53402C] hover:text-[#1A1A1E]'
                  }`}
                >
                  Raw Clauses
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('citations')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === 'citations'
                      ? 'bg-[#1A1A1E] text-white font-bold'
                      : 'bg-[#F2EEE5] text-[#53402C] hover:text-[#1A1A1E]'
                  }`}
                >
                  Citations (100%)
                </button>
                <a
                  href={current.pdfUrl}
                  download
                  className="p-1.5 text-[#53402C] hover:text-[#1A1A1E] rounded-full hover:bg-[#F2EEE5] transition-colors ml-1"
                  title="Download Raw PDF Schedule"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Display Body */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Context Details */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#FF5C00]">
                    Invariant Breakdown
                  </span>
                  <h4 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
                    Mandatory 3-Section Decomposition
                  </h4>
                  <p className="text-xs text-[#53402C] leading-relaxed">
                    Extracted automatically by the PolicyVision compiler, enforcing plain-language transparency across the three IRDAI dimensions:
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FCF8EF] border border-[#ECD9B9]">
                    <span className="text-[#FF5C00] font-bold block mb-1">01. WHAT IS COVERED</span>
                    <span className="text-[#1A1A1E]">Full Sum Insured ({current.sumInsured}), ICU, Day Care, AYUSH &amp; Ambulance fees without room rent capping.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FCF8EF] border border-[#ECD9B9]">
                    <span className="text-[#FF5C00] font-bold block mb-1">02. WHAT IS NOT COVERED</span>
                    <span className="text-[#1A1A1E]">{current.waitingPeriod} initial exclusion, {current.pedWaiting}, cosmetic procedures, and non-medical items.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FCF8EF] border border-[#ECD9B9]">
                    <span className="text-[#FF5C00] font-bold block mb-1">03. HOW TO CLAIM</span>
                    <span className="text-[#1A1A1E]">3-step cashless settlement flow: TPA intimation ({current.cashlessWindow}), e-card verification, direct hospital discharge.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onEnterStudio}
                  className="w-full btn-clinia-primary py-3 text-xs font-mono uppercase tracking-wider"
                >
                  Process This Policy in Studio
                </button>
              </div>

              {/* Right Column: Visual Explainer Viewport */}
              <div className="lg:col-span-7">
                {activeTab === 'visual' ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#ECD9B9] bg-[#1A1A1E] aspect-[16/11] flex items-center justify-center shadow-inner">
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
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-2 rounded-full bg-[#1A1A1E]/80 text-white hover:text-[#FF5C00] border border-white/10 transition-colors"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    </div>
                    <div className="absolute bottom-3 inset-x-3 bg-[#1A1A1E]/90 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-white">
                      <div>
                        <span className="text-[#FF5C00] font-bold">1024×1024 PNG</span>
                        <span className="text-white/60 ml-2">PyMuPDF Tokenized • 150 DPI</span>
                      </div>
                      <span className="text-emerald-400 font-bold">0.15 Cosine Bound</span>
                    </div>
                  </div>
                ) : activeTab === 'clauses' ? (
                  <div className="rounded-2xl border border-[#ECD9B9] bg-[#1A1A1E] text-slate-200 p-6 font-mono text-xs leading-relaxed aspect-[16/11] overflow-y-auto whitespace-pre-line">
                    <div className="text-[#FF5C00] font-bold mb-3 uppercase tracking-wider">
                      Policy Schedule Clause Telemetry ({current.policyNo})
                    </div>
                    {current.excerpt}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#ECD9B9] bg-[#FCF8EF] p-6 font-mono text-xs space-y-4 aspect-[16/11] overflow-y-auto">
                    <div className="text-[#FF5C00] font-bold uppercase tracking-wider">
                      Verified Passage Vectors &amp; Similarity
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#ECD9B9]">
                      <div className="text-[#1A1A1E] font-bold">Section 4.1: Waiting Period</div>
                      <div className="text-[#53402C] mt-1">Page 3, Paragraph 2 • Cosine Similarity: 0.94 • 100% Grounded</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#ECD9B9]">
                      <div className="text-[#1A1A1E] font-bold">Section 4.2: Pre-Existing Disease</div>
                      <div className="text-[#53402C] mt-1">Page 4, Paragraph 1 • Cosine Similarity: 0.91 • 100% Grounded</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#ECD9B9]">
                      <div className="text-[#1A1A1E] font-bold">Section 7.1: Cashless Intimation Timeline</div>
                      <div className="text-[#53402C] mt-1">Page 7, Paragraph 4 • Cosine Similarity: 0.88 • 100% Grounded</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Clinia's 3-Pillar Architecture ("Health-native", "Evaluation-first", "Flexible and secure") ── */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-12">
        <div className="max-w-3xl mb-16 space-y-3">
          <div className="font-mono text-xs uppercase tracking-wider text-[#FF5C00] font-semibold">
            Architectural Guarantees
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl font-normal tracking-tight text-[#1A1A1E]">
            Engineered for mission-critical insurance compliance
          </h2>
          <p className="text-base text-[#53402C] leading-relaxed">
            PolicyVision AI enforces strict deterministic pipelines, verified passage embeddings, and regulatory compliance standards across every document.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Policy-native (Clinia's Health-native) */}
          <div className="card-clinia p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#FCF8EF] border border-[#ECD9B9] flex items-center justify-center text-[#FF5C00]">
              <FileText size={20} />
            </div>
            <h3 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
              Policy-native
            </h3>
            <p className="text-sm text-[#53402C] leading-relaxed font-normal">
              Built directly on PyMuPDF and tabular parser engines. Ingests complex multi-page schedules, waiting-period tables, and exclusions up to 50 MB with OCR fallback.
            </p>
            <div className="pt-2 font-mono text-xs text-[#95795C]">
              PyMuPDF Tokenizer • 50 MB Ceiling
            </div>
          </div>

          {/* Pillar 2: Evaluation-first (Clinia's Evaluation-first) */}
          <div className="card-clinia p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#FCF8EF] border border-[#ECD9B9] flex items-center justify-center text-[#FF5C00]">
              <Shield size={20} />
            </div>
            <h3 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
              Evaluation-first
            </h3>
            <p className="text-sm text-[#53402C] leading-relaxed font-normal">
              Eliminates free-form diffusion hieroglyphics. Strict 0.15 cosine similarity threshold binds every generated phrase, monetary cap, and waiting period to source contract passages.
            </p>
            <div className="pt-2 font-mono text-xs text-[#95795C]">
              0.15 Cosine Floor • Zero Diffusion Slop
            </div>
          </div>

          {/* Pillar 3: Flexible and secure (Clinia's Flexible and secure) */}
          <div className="card-clinia p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#FCF8EF] border border-[#ECD9B9] flex items-center justify-center text-[#FF5C00]">
              <Lock size={20} />
            </div>
            <h3 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
              Flexible &amp; secure
            </h3>
            <p className="text-sm text-[#53402C] leading-relaxed font-normal">
              Zero permanent contract retention. Ephemeral in-memory embeddings automatically purged after 4 hours of inactivity. Multi-script synthesis across 8 Indic languages.
            </p>
            <div className="pt-2 font-mono text-xs text-[#95795C]">
              4h Memory Purge • 8 Indic Scripts
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Clinia CTA Strip ── */}
      <section className="border-t border-[#ECD9B9] bg-[#1A1A1E] text-white py-20 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="font-mono text-xs uppercase tracking-wider text-[#FF5C00]">
              Get Started with PolicyVision
            </div>
            <h2 className="font-editorial text-3xl sm:text-5xl font-normal tracking-tight text-white">
              Ready to transform your policy documents?
            </h2>
            <p className="text-sm text-slate-400">
              Test with the included IRDAI policy schedules or upload any insurance contract to generate publication-ready visual explainers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRegister || onEnterStudio}
              className="btn-clinia-vital text-sm font-medium py-3.5 px-7 shadow-lg"
            >
              <span>Launch Policy Studio</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. Clinia Editorial Footer ── */}
      <footer className="border-t border-[#ECD9B9] py-10 px-6 sm:px-12 bg-[#FCF8EF] text-xs font-mono text-[#53402C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#1A1A1E] text-sm tracking-tight">PolicyVision AI</span>
            <span>•</span>
            <span>Context Engine for Insurance Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <span>IRDAI Regulatory Standards</span>
            <span>150 DPI PNG</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
