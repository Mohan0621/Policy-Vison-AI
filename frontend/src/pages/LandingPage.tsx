import React, { useState, useEffect } from 'react';
import {
  Shield, Check, ArrowRight, ChevronDown, Clock,
  Sparkles, Bell, ArrowUp, ImageIcon, Layers, ShieldCheck
} from 'lucide-react';
import { SerkoHeroGlobe } from '../components/SerkoHeroGlobe';
import { PolicyDiffSlider } from '../components/PolicyDiffSlider';
import { ClaimsTimelineStepper } from '../components/ClaimsTimelineStepper';

interface LandingPageProps {
  onEnterStudio: () => void;
  onSignIn?: () => void;
  onRegister?: () => void;
  onOpenCitationDrawer?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterStudio,
  onSignIn,
  onRegister,
  onOpenCitationDrawer,
}) => {
  // Hero cycling generative visual scenarios
  const heroStates = [
    {
      trace: 'Care Health ₹15L Coverage Infographic generated in 3.2s',
      routeTitle: 'PRODUCT -> HEALTH OPTIMA',
      routeMeta: 'Room Rent Cap · ₹5,000/day · Visual Ready',
      confTitle: 'Customer Education Asset',
      confSub: '1024×1024 · 150 DPI Print-Ready',
      confBadge: 'Published',
    },
    {
      trace: 'Cashless Hospitalization Claim Flowchart generated in 2.8s',
      routeTitle: 'CLAIMS -> CASHLESS WORKFLOW',
      routeMeta: 'Emergency (24h) vs Planned (48h) Schema',
      confTitle: 'Policyholder Onboarding Kit',
      confSub: 'Multi-lingual Hindi & English',
      confBadge: 'Generated',
    },
    {
      trace: 'Star Comprehensive Senior Citizen Explainer ready in 3.1s',
      routeTitle: 'PRODUCT -> SENIOR COMPREHENSIVE',
      routeMeta: 'Pre-existing 24m waiver matrix visual',
      confTitle: 'Marketing Infographic Deck',
      confSub: 'Diffusion Visual Synthesized',
      confBadge: 'Published',
    },
  ];

  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroStates.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroStates.length]);

  const activeHero = heroStates[heroIdx];

  // Feature 1 interactive visual mode toggle
  const [f1Mode, setF1Mode] = useState<'infographic' | 'flowchart'>('infographic');

  // Feature 2 Customer Education Templates state
  const [selectedFixIdx, setSelectedFixIdx] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  const triggerPulse = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 800);
  };

  // Feature 4 interactive recents state
  const [activeRecentIdx, setActiveRecentIdx] = useState(0);
  const recentProducts = [
    { name: 'Care Health Optima ₹15L', alert: 'Product Explainer Visual Generated · 1024×1024 150 DPI' },
    { name: 'Star Comprehensive Floater', alert: 'Claims Flowchart Ready · Emergency vs Planned Hospitalization' },
    { name: 'HDFC ERGO Optima Secure', alert: '2X Instant Restoration Infographic · Multi-script Indic' },
  ];

  // FAQs state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: 'Why use generative diffusion for insurance explainers instead of custom agency illustration?',
      a: 'Custom illustration for every insurance product line is painfully slow and expensive—often taking design agencies 2 to 3 weeks per brochure. PolicyVision uses generative diffusion models to synthesize publication-ready 1024×1024 visual infographics and procedural flowcharts directly from policy text in seconds, speeding content production by over 10x.',
    },
    {
      q: 'How does PolicyVision prevent AI hallucinations on legal policy terms?',
      a: 'PolicyVision anchors every generated visual directly into the ingested policy contract, Customer Information Sheet (CIS), or endorsement schedule. Sentence-level document grounding ensures that critical sub-limits (like room rent caps, copayment ratios, and disease waiting periods) match exact legal wording with zero fabricated coverage.',
    },
    {
      q: 'What types of visual explainers can insurers generate?',
      a: 'PolicyVision specializes in two core BFSI customer education visual formats: (1) Product Coverage Infographics that break down inclusions, exclusions, and financial caps into scannable cards, and (2) Claims Process Flowcharts illustrating dual-path emergency vs. planned cashless hospital admission workflows.',
    },
    {
      q: 'Can the visuals be generated in regional Indic languages?',
      a: 'Yes. PolicyVision natively supports 8 Indic languages (Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, and Malayalam) with typographical multi-script preservation, enabling insurers to distribute localized customer education materials to policyholders nationwide.',
    },
    {
      q: 'Are generated visuals print-ready for marketing and customer onboarding?',
      a: 'Yes. Every visual explainer is rendered at 1024×1024 resolution with 150 DPI print-ready clarity, embedded with XMP metadata for regulatory compliance, and downloadable as high-resolution PNGs or packaged in a complete session ZIP bundle.',
    },
  ];

  const marqueeItems = [
    'Diffusion Explainer Synthesis',
    '1024×1024 150 DPI Print-Ready',
    'Policy Product Infographics',
    'Cashless Claims Flowcharts',
    'Customer Education Material',
    '10x Faster Content Production',
    'Zero-Hallucination Grounding',
    'Multi-Lingual Indic (8 Scripts)',
    'BFSI Insurance Standard',
  ];

  return (
    <div className="min-h-screen bg-white text-[#000000] font-sans selection:bg-[#CF69E0]/25">
      {/* ═════════════════════════════════════════════════════════════
          PAGE 1: HOME HERO (Serko Horizon Command Press)
         ═════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[960px] lg:min-h-[1060px] serko-hero-bg flex flex-col items-center pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* HTML5 Canvas Fibonacci Stippled Globe Backdrop */}
        <SerkoHeroGlobe className="top-0 h-full opacity-90" />

        {/* Hero Content Above the Globe Horizon */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-5">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B98F2]" />
            <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
              Gen AI Image Generation App · Insurance (BFSI)
            </span>
          </div>

          {/* Display Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-[#000000] leading-[1.06] max-w-3xl">
            Generative visuals for{' '}
            <span className="horizon-gradient-text">insurance policies</span>
            <br />
            & claims education.
          </h1>

          {/* Subtitle strictly aligned to the Problem Statement */}
          <p className="text-base sm:text-lg text-black/75 max-w-2xl leading-relaxed font-normal">
            Insurers need clear visual explainers for policy products and claims processes, but custom illustration for every product line is slow. PolicyVision generates print-ready visual infographics and process flowcharts directly from policy text via diffusion models.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onRegister || onEnterStudio}
              className="serko-btn-black !text-sm !py-3 !px-6 flex items-center gap-2"
            >
              <span>Generate Visuals Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#how-it-works"
              className="serko-btn-white !text-sm !py-3 !px-6"
            >
              How it works
            </a>

            <button
              onClick={onEnterStudio}
              className="serko-btn-rainbow"
            >
              <span className="!text-sm !py-2.5 !px-5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#CF69E0]" />
                <span>Diffusion Visual Engine</span>
              </span>
            </button>
          </div>
        </div>

        {/* Breathing Space over globe dome before Hero Interactive Card */}
        <div className="w-full h-16 sm:h-24" />

        {/* ── Layered Hero Profile Showcase Widget (Matches AgentOps buildHeroInteractiveCard) ── */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-2 mt-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-6">
            {/* 1. Left Flanking Floating Chip: Flowchart Mode */}
            <div
              onClick={() => setHeroIdx(1)}
              className={`w-full sm:w-[220px] bg-white rounded-2xl border p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer transform hover:-translate-y-1 ${
                heroIdx === 1 ? 'border-[#1B98F2] ring-2 ring-[#1B98F2]/20 shadow-[0_12px_28px_rgba(27,152,242,0.15)]' : 'border-black/[0.06] hover:border-[#1B98F2]/40'
              }`}
            >
              <div className="flex items-center justify-between text-[#000000]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#1B98F2]" />
                  <span className="text-[11.5px] font-bold tracking-tight uppercase truncate">
                    CLAIMS FLOWCHART
                  </span>
                </div>
                <span className="text-[9.5px] font-bold text-[#158142] bg-[#C0F2B5] px-1.5 py-0.5 rounded-full">
                  DUAL-PATH
                </span>
              </div>
              <p className="text-[11.5px] text-[#71717A] mt-1.5 truncate">
                Emergency (24h) vs Planned (48h)
              </p>
              <div className="mt-2 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[10.5px] text-[#52525B]">
                <span>Decision Diamond</span>
                <span className="font-semibold text-[#1B98F2]">Active</span>
              </div>
            </div>

            {/* 2. Center Serko Layered Profile Widget (#F6F6F6 container) */}
            <div className="w-full sm:w-[430px] bg-[#F6F6F6] rounded-[22px] border border-black/[0.06] p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.10)] hover:border-[#1B98F2]/30 transition-all">
              {/* Top White Prompt Choice Bar */}
              <div
                onClick={() => setHeroIdx((prev) => (prev + 1) % heroStates.length)}
                className="flex items-center justify-between bg-white rounded-xl p-2.5 px-3.5 border border-transparent hover:border-black/[0.1] shadow-sm cursor-pointer transition-all group"
                title="Click to cycle generated insurance visual explainers"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#FF8C51] via-[#F56293] to-[#CF69E0] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium text-[#000000] truncate">
                    {activeHero.trace}
                  </span>
                </div>

                <div className="w-6 h-6 rounded-full bg-[#F6F6F6] group-hover:bg-[#000000] group-hover:text-white flex items-center justify-center text-[#71717A] transition-colors shrink-0 ml-2">
                  <ArrowUp className="w-3 h-3 rotate-45" />
                </div>
              </div>

              {/* Middle Interactive Visual Preview Snippet */}
              <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-black/[0.04] flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden shrink-0 flex items-center justify-center relative">
                  <img
                    src={heroIdx === 1 ? '/claims_flowchart_explainer.png' : '/coverage_infographic_explainer.png'}
                    alt="Visual Explainer Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/clean_policy_infographic.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#17510B] bg-[#C0F2B5] px-1.5 py-0.2 rounded">
                      150 DPI PRINT READY
                    </span>
                    <span className="text-[10px] text-[#71717A] font-mono">1024×1024</span>
                  </div>
                  <p className="text-xs font-bold text-[#000000] truncate mt-1">
                    {heroIdx === 1 ? 'Cashless Adjudication Flowchart' : 'Executive Coverage Infographic'}
                  </p>
                  <p className="text-[10.5px] text-[#52525B] truncate">
                    {heroIdx === 1 ? 'Directional arrows · Decision split · 3h TAT' : 'Hospital facade · Shield umbrella · Limits meter'}
                  </p>
                </div>
              </div>

              {/* Bottom Service Watch Profile Strip */}
              <div className="flex items-center justify-between pt-3 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-lg bg-white shadow-sm border border-black/[0.06] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#000000]" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#158142] ring-2 ring-white animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#000000] leading-tight">
                      PolicyVision Generator
                    </p>
                    <p className="text-[10.5px] text-[#71717A]">
                      Diffusion Active · 1024² 150 DPI · 10x Speed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#17510B] bg-[#C0F2B5] px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#17510B]" />
                  <span>Ready</span>
                </div>
              </div>
            </div>

            {/* 3. Right Flanking Floating Chip: Coverage Mode */}
            <div
              onClick={() => setHeroIdx(0)}
              className={`w-full sm:w-[240px] bg-white rounded-2xl border p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer transform hover:-translate-y-1 ${
                heroIdx === 0 ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 shadow-[0_12px_28px_rgba(22,163,74,0.15)]' : 'border-black/[0.06] hover:border-[#16A34A]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <Layers className="w-3.5 h-3.5 text-[#16A34A]" />
                  <p className="text-xs font-bold text-[#000000] truncate">
                    COVERAGE INFOGRAPHIC
                  </p>
                </div>
                <span className="text-[10.5px] font-semibold text-[#17510B] bg-[#C0F2B5] px-2 py-0.5 rounded-md shrink-0">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] truncate mt-1">
                Sum Insured · Room Rent · ICU Cap
              </p>
              <div className="mt-2 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[10.5px] text-[#52525B]">
                <span>Vector Pictorial Art</span>
                <span className="font-semibold text-[#16A34A]">IRDAI Grounded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          TECH MARQUEE STRIP (Monochrome Editorial)
         ═════════════════════════════════════════════════════════════ */}
      <section className="w-full border-y border-[#E5E7EB] bg-white py-4 overflow-hidden">
        <div className="relative w-full flex items-center">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex items-center gap-8 whitespace-nowrap animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused]">
            {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => (
              <span
                key={idx}
                className="text-xs sm:text-sm font-medium text-[#71717A] hover:text-[#000000] hover:bg-[#F4F4F5] px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          INTERACTIVE BEFORE & AFTER: DENSE POLICY WORDING VS VISUAL EXPLAINER
         ═════════════════════════════════════════════════════════════ */}
      <section id="before-after-diff" className="w-full bg-[#FAFAFA] py-16 lg:py-24 px-4 sm:px-6 border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B98F2]" />
              <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#52525B]">
                Interactive Clarity Benchmark
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#000000] leading-tight">
              From 40 pages of dense legalese to instant visual comprehension.
            </h2>
            <p className="text-base text-black/70 leading-relaxed font-normal">
              Compare standard insurance underwriter fine print against PolicyVision AI's 150 DPI explainer syntheses. Drag the interactive split bar to inspect clarity gains.
            </p>
          </div>

          <PolicyDiffSlider onOpenViewer={onEnterStudio} />
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          FEATURE 1: THE SPEED BOTTLENECK SOLVED (#E8F3FE, live-02)
         ═════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="w-full bg-[#E8F3FE] py-20 lg:py-28 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Copy: The Core Problem & Diffusion Solution */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#CFE6FC]">
              <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#0369A1]">
                Accelerated Content Production
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#000000] leading-[1.12] tracking-tight">
              Custom illustration is slow.
              <br />
              Diffusion makes it instant.
            </h2>

            <p className="text-base text-black/70 leading-relaxed max-w-lg">
              Insurers need clear visual explainers for policy products and claims processes, but manual design cycles take weeks for every product line. PolicyVision transforms policy wording into executive infographics and dual-path claims flowcharts via diffusion in under 10 seconds.
            </p>

            {/* Interactive Visual Format Switchers */}
            <div className="space-y-3 pt-2">
              <div
                onClick={() => setF1Mode('infographic')}
                className={`p-3.5 rounded-2xl flex items-start gap-3.5 transition-all cursor-pointer ${
                  f1Mode === 'infographic'
                    ? 'bg-white shadow-[0_6px_20px_rgba(0,0,0,0.06)]'
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    f1Mode === 'infographic'
                      ? 'bg-[#000000] text-white'
                      : 'bg-white border border-[#CFE6FC] text-[#000000]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#000000]">
                    Policy Product Infographics
                  </h4>
                  <p className="text-xs text-black/65 mt-0.5 leading-relaxed">
                    Transform dense legal terms into structured cards highlighting room rent caps, copays, and waiting periods.
                  </p>
                </div>
              </div>

              {/* Dotted divider */}
              <div className="w-full border-t border-dotted border-black/15 my-1" />

              <div
                onClick={() => setF1Mode('flowchart')}
                className={`p-3.5 rounded-2xl flex items-start gap-3.5 transition-all cursor-pointer ${
                  f1Mode === 'flowchart'
                    ? 'bg-white shadow-[0_6px_20px_rgba(0,0,0,0.06)]'
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    f1Mode === 'flowchart'
                      ? 'bg-[#000000] text-white'
                      : 'bg-white border border-[#CFE6FC] text-[#000000]'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#000000]">
                    Claims Process Flowcharts
                  </h4>
                  <p className="text-xs text-black/65 mt-0.5 leading-relaxed">
                    Map step-by-step cashless hospital admission and reimbursement paths for policyholder education.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Showcase Visual Card (Pink-Coral Sunset Frame) */}
          <div className="relative p-6 sm:p-9 rounded-[28px] bg-gradient-to-br from-[#FFB2BE] via-[#F489AD] to-[#E388F2] shadow-[0_20px_40px_rgba(244,137,173,0.3)]">
            <div className="bg-white rounded-2xl p-6 shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-white space-y-4 hover:-translate-y-1 transition-transform">
              {/* Top minimal header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#000000] text-white flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-[#000000]">
                    PolicyVision Generative Canvas
                  </span>
                </div>
                <span className="text-xs font-bold text-[#158142] bg-[#C0F2B5] px-2 py-0.5 rounded-full">
                  1024×1024 · 150 DPI
                </span>
              </div>

              {/* Dynamic Mode Content */}
              <div className="space-y-2 py-2">
                <p className="text-xs font-medium text-[#71717A]">
                  {f1Mode === 'infographic'
                    ? 'Care Health Optima · Product Coverage Explainer'
                    : 'Cashless Hospital Admission · Claims Workflow Schema'}
                </p>
                <p className="text-sm font-medium text-[#000000] leading-relaxed">
                  {f1Mode === 'infographic'
                    ? 'Visual Summary: Room rent capped at 1% of Sum Insured (₹15,000/day). ICU uncapped. 60 days pre-hospitalization & 90 days post-discharge fully covered.'
                    : 'Process Map: Emergency admission requires insurer notification within 24 hours. Planned surgery requires 48-hour pre-authorization at hospital TPA desk.'}
                </p>

                <div className="pt-2">
                  <button
                    onClick={onEnterStudio}
                    className="serko-btn-black !text-xs !py-2 !px-4"
                  >
                    {f1Mode === 'infographic' ? 'Generate Product Infographic' : 'Generate Claims Flowchart'}
                  </button>
                </div>
              </div>

              {/* Bottom Composer Row ('P' avatar + pill composer + send arrow) */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-black/[0.06]">
                <div className="w-7 h-7 rounded-full bg-[#C7D2FE] text-[#312E81] flex items-center justify-center font-bold text-xs">
                  P
                </div>
                <div
                  onClick={onEnterStudio}
                  className="flex-1 flex items-center justify-between bg-[#FAFAFA] hover:bg-white hover:border-[#18181B] border border-[#E4E4E7] rounded-full px-3 py-1.5 cursor-pointer transition-colors group"
                >
                  <span className="text-xs text-[#71717A] group-hover:text-[#000000]">
                    Describe policy terms or upload PDF...
                  </span>
                  <div className="w-5 h-5 rounded-full bg-[#F4F4F5] group-hover:bg-[#000000] group-hover:text-white flex items-center justify-center text-[#71717A] transition-colors">
                    <ArrowUp className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          FEATURE 2: POLICY PRODUCTS & CLAIMS EDUCATION STRIP (live-03)
         ═════════════════════════════════════════════════════════════ */}
      <section id="visuals" className="w-full bg-white py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12 text-center">
          {/* Header */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F6F6] border border-[#E5E7EB]">
              <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
                Customer Education Material
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#000000] leading-tight tracking-tight">
              Speed content production
              <br />
              for every insurance product line.
            </h2>

            <p className="text-base text-black/70 leading-relaxed font-normal">
              Insurers need tailored educational visual assets across brochures, agent decks, and customer portals. PolicyVision produces high-converting visual templates on demand via diffusion.
            </p>
          </div>

          {/* Rounded Horizon Card Frame (sky -> purple -> coral backdrop) */}
          <div className="rounded-[32px] p-6 sm:p-10 bg-gradient-to-b from-[#DFECFE] via-[#96CBFA]/50 to-[#FF8C51]/80 shadow-[0_24px_50px_rgba(255,140,81,0.2)] space-y-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#000000]">
              Visual explainer formats built for policyholder clarity.
            </h3>

            {/* 5 Side-by-Side Vertical Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Featured Claims Guide */}
              <div className="bg-gradient-to-b from-[#EBF3FE] to-[#F3EAFF] rounded-2xl p-4 border border-sky-300/60 shadow-[0_6px_20px_rgba(0,0,0,0.06)] flex flex-col justify-between text-left space-y-3 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-[#1B98F2]" />
                  </div>
                  <span className="text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">
                    Claims Flow
                  </span>
                </div>

                <div>
                  <p className="text-[11px] text-black/55 font-medium">Visual Template 01</p>
                  <p className="text-sm font-bold text-[#000000]">Cashless Claim Guide</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] mt-1">
                    <Shield className="w-3 h-3 text-[#1B98F2]" />
                    <span>Dual-path decision tree</span>
                  </div>
                </div>

                {/* Real miniature visual preview chip */}
                <div className="bg-white/90 rounded-xl p-2.5 border border-black/[0.06] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#158142] shrink-0" />
                  <span className="text-[10.5px] font-semibold text-[#000000] truncate">Emergency 24h &bull; Planned 48h</span>
                </div>

                <button
                  onClick={() => {
                    triggerPulse();
                    onEnterStudio();
                  }}
                  className="w-full bg-[#000000] text-white hover:bg-zinc-800 text-xs font-semibold py-2 px-3 rounded-full transition-colors shadow-sm"
                >
                  Generate Flowchart &rsaquo;
                </button>
              </div>

              {/* Cards 2-5: Additional Explainer Templates */}
              {[
                { title: 'Room Rent & Copay', type: 'Product Cap', meta: 'Single AC Room &bull; 0 Penalty', tag: 'Sub-Limits', badge: '1% SI Cap' },
                { title: 'Waiting Period Matrix', type: 'Policy Matrix', meta: 'PED 24m &bull; Accident Day 1', tag: 'Timeline', badge: '36 Months' },
                { title: 'Restoration Benefit', type: 'Auto-Reload', meta: '100% Reload on Exhaustion', tag: 'Coverage', badge: 'Unlimited' },
                { title: 'Day Care Surgeries', type: 'Clinical Scope', meta: '586+ Outpatient Procedures', tag: 'Surgeries', badge: 'No Stay' },
              ].map((opt, idx) => {
                const isSelected = selectedFixIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedFixIdx(isSelected ? null : idx)}
                    className={`bg-white rounded-2xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)] flex flex-col justify-between text-left space-y-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#16A34A] -translate-y-1 shadow-[0_12px_28px_rgba(22,163,74,0.18)]'
                        : isPulsing
                        ? 'border-2 border-[#1B98F2] -translate-y-1'
                        : 'border border-transparent hover:border-[#1B98F2]/40 hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1B98F2] flex items-center justify-center">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-[#71717A] bg-[#F6F6F6] px-2 py-0.5 rounded-full">
                        {opt.tag}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] text-black/55 font-medium">Visual Template 0{idx + 2}</p>
                      <p className="text-sm font-bold text-[#000000]">{opt.title}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] mt-1">
                        <Check className="w-3 h-3 text-[#16A34A]" />
                        <span>{opt.meta}</span>
                      </div>
                    </div>

                    {/* Real miniature detail pill */}
                    <div className="bg-[#F8FAFC] rounded-xl p-2 border border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-[10.5px] font-mono text-[#52525B]">Metric</span>
                      <span className="text-[10.5px] font-bold text-[#0F172A]">{opt.badge}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnterStudio();
                      }}
                      className={`w-full text-xs font-semibold py-2 px-3 rounded-full transition-colors ${
                        isSelected
                          ? 'bg-[#C0F2B5] text-[#17510B]'
                          : 'bg-[#000000] text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Generate Visual &rsaquo;'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          STANDARDIZED 4-STAGE CASHLESS CLAIMS PROCESS STEPPER
         ═════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#F8FAFC] py-16 lg:py-24 px-4 sm:px-6 border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#158142]" />
              <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#0F172A]">
                IRDAI Cashless Process Protocol
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#000000] leading-tight">
              Interactive 4-Stage Cashless Pathway
            </h2>
            <p className="text-base text-black/70 leading-relaxed font-normal">
              Click each stage to inspect required hospital paperwork, 60-minute pre-authorization turnaround mandates, and final discharge billing rules.
            </p>
          </div>

          <ClaimsTimelineStepper />
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          FEATURE 3: FROSTED GLASS OVERLAY ARTWORK (live-04)
         ═════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-white py-20 lg:py-28 px-6 sm:px-12 lg:px-20 border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Copy: Speeding Content Production */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F6F6] border border-[#E5E7EB]">
              <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
                Generative Explainer Visual Tool
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#000000] leading-tight tracking-tight">
              From 3 weeks of agency design
              <br />
              to seconds of diffusion generation.
            </h2>

            <p className="text-base text-black/70 leading-relaxed max-w-lg">
              Every time your product team drafts a new policy rider or alters copayment thresholds, PolicyVision updates your visual explainers across web, mobile, and agent print kits instantly.
            </p>

            <div className="pt-2">
              <button
                onClick={onEnterStudio}
                className="serko-btn-black !text-sm !py-3 !px-6"
              >
                Launch Generative Studio
              </button>
            </div>
          </div>

          {/* Right Atmospheric Sky Visual Box with 4 Frosted White Strips */}
          <div className="relative min-h-[380px] rounded-[28px] p-8 bg-[radial-gradient(ellipse_at_25%_30%,#96CBFA_0%,#5BB1F7_40%,#1B98F2_100%)] shadow-[0_20px_40px_rgba(27,152,242,0.25)] flex flex-col justify-end overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-radial from-[#FF635C]/60 via-[#F489AD]/30 to-transparent pointer-events-none rounded-br-[28px]" />

            {/* 4 Cascading Translucent White Strips */}
            <div className="relative z-10 space-y-2.5 max-w-xs ml-auto">
              {[
                { title: '10x Faster Content Production', opacity: 'bg-white/95' },
                { title: '100% Policy-Grounded Text', opacity: 'bg-white/85' },
                { title: 'Dual-Path Claims Schema', opacity: 'bg-white/75' },
                { title: '1024×1024 Print & Mobile Ready', opacity: 'bg-white/65' },
              ].map((strip, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3.5 px-4 rounded-xl ${strip.opacity} shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white hover:-translate-x-2 transition-all cursor-pointer backdrop-blur-sm`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#FF897F] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#000000]">
                    {strip.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          FEATURE 4: "Works for your insurance teams." Flush Bottom Preview (live-05)
         ═════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#F8FAFC] pt-20 lg:pt-28 px-4 sm:px-6 border-t border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto space-y-10 text-center">
          {/* Header */}
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#000000] leading-tight tracking-tight">
              Works for your insurance teams.
            </h2>

            <p className="text-base text-black/70 leading-relaxed font-normal">
              Marketing, underwriting, and policyholder service teams can generate, edit, and export publication-ready visual explainers for any product line in seconds. All in one place.
            </p>

            <div className="pt-2">
              <button
                onClick={onEnterStudio}
                className="serko-btn-black !text-sm !py-2.5 !px-5"
              >
                PolicyVision for teams
              </button>
            </div>
          </div>

          {/* Flush Bottom App Chrome Frame */}
          <div className="max-w-4xl mx-auto bg-white rounded-t-[24px] border-t border-x border-black/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row min-h-[380px]">
            {/* Left Mini Sidebar */}
            <div className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-[#E5E7EB] bg-white flex flex-col justify-between text-left space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#000000] text-white flex items-center justify-center font-bold text-[10px]">
                      PV
                    </div>
                    <span className="text-xs font-bold text-[#000000]">PolicyVision</span>
                  </div>
                  <Bell className="w-3.5 h-3.5 text-[#71717A]" />
                </div>

                <button
                  onClick={onEnterStudio}
                  className="w-full text-left text-xs font-semibold text-[#000000] hover:bg-[#F4F4F5] p-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="text-sm font-bold">+</span>
                  <span>New product visual</span>
                </button>

                {/* Recents product visuals list */}
                <div className="space-y-1">
                  <p className="text-[10.5px] uppercase font-bold text-[#A1A1AA] px-2">
                    Recent Products
                  </p>
                  {recentProducts.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveRecentIdx(idx)}
                      className={`text-xs p-2 rounded-lg cursor-pointer transition-colors ${
                        activeRecentIdx === idx
                          ? 'bg-[#EFF6FF] text-[#09090B] font-semibold'
                          : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#09090B]'
                      }`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-[#A1A1AA] border-t border-[#E5E7EB] pt-2">
                1024×1024 150 DPI Standard
              </div>
            </div>

            {/* Main Inner Canvas (Soft Sky/Violet) */}
            <div className="flex-1 bg-gradient-to-br from-[#EBF4FE] via-[#F5ECFF] to-[#DCEBFF] p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4">
              <h4 className="text-xl sm:text-2xl font-bold text-[#000000]">
                Generative Explainer Studio
              </h4>
              <p className="text-xs sm:text-sm text-black/60 max-w-sm">
                Paste policy descriptions to generate infographics & flowcharts
              </p>

              {/* Clickable alert banner */}
              <div
                onClick={onEnterStudio}
                className="w-full max-w-md bg-white/75 hover:bg-white border border-transparent hover:border-[#1B98F2]/30 p-2.5 px-4 rounded-xl flex items-center gap-2.5 shadow-sm cursor-pointer transition-all hover:scale-[1.01]"
              >
                <ImageIcon className="w-4 h-4 text-[#1B98F2] shrink-0" />
                <span className="text-xs font-medium text-[#18181B] truncate text-left">
                  {recentProducts[activeRecentIdx].alert}
                </span>
              </div>

              {/* Prompt box */}
              <div
                onClick={onEnterStudio}
                className="w-full max-w-md bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-black/10 transition-all cursor-pointer text-left space-y-3"
              >
                <p className="text-xs text-[#71717A]">
                  Describe policy product or drop Customer Information Sheet (CIS)...
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-[#71717A]">+</span>
                  <button className="serko-btn-black !text-xs !py-1.5 !px-3">
                    Generate Visual
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          BOTTOM HORIZON CTA BANNER (serko-cta-bg, Matches cta1_wrap)
         ═════════════════════════════════════════════════════════════ */}
      <section className="w-full serko-cta-bg py-20 lg:py-28 px-6 sm:px-12 text-center flex flex-col items-center justify-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-black/[0.08] shadow-sm">
          <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
            Speed Content Production
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-[46px] font-bold text-[#000000] leading-tight tracking-tight max-w-2xl">
          Ready to turn policy descriptions into{' '}
          <span className="horizon-gradient-text">explainer visuals?</span>
        </h2>

        <p className="text-base text-black/70 max-w-lg leading-relaxed font-normal">
          Replace slow, costly agency illustration with instant, diffusion-powered customer education visuals.
        </p>

        <div className="pt-2">
          <button
            onClick={onRegister || onEnterStudio}
            className="serko-btn-black !text-sm !py-3 !px-7 flex items-center gap-2"
          >
            <span>Generate Explainer Visuals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          STAGGERED CONTENT-FITTED FAQ ACCORDION (Matches live-06)
         ═════════════════════════════════════════════════════════════ */}
      <section id="faqs" className="w-full bg-white py-20 lg:py-24 px-6 sm:px-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F6F6] border border-[#E5E7EB]">
              <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
                FAQs
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#000000] tracking-tight">
              Got questions about generative policy visuals?
              <br />
              Here’s what insurance teams ask.
            </h2>
          </div>

          {/* Staggered speech-bubble questions */}
          <div className="space-y-4 max-w-xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="space-y-2">
                  <div
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="inline-flex items-center gap-3 bg-white hover:bg-[#FAFAFA] border border-black/[0.08] hover:border-black/[0.2] rounded-[10px_10px_3px_10px] p-3 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)] cursor-pointer transition-all text-left"
                  >
                    <span className="text-sm font-medium text-[#000000]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#000000] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {isOpen && (
                    <div className="bg-black/[0.035] rounded-[9px_9px_9px_3px] p-4 text-xs sm:text-[13.5px] text-[#4D4D4D] leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          LIGHT EDITORIAL FOOTER (live-07)
         ═════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-white border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Left Brand Col */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold text-xs">
                  <Shield className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-base font-bold text-[#000000] tracking-tight">
                  PolicyVision<span className="text-[#1B98F2]">.ai</span>
                </span>
              </div>

              <p className="text-xl sm:text-2xl font-normal text-[#000000] leading-snug">
                <span className="font-semibold">Be there</span> for the policyholders
                <br />
                with clear visuals.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={onRegister || onEnterStudio}
                  className="serko-btn-black !text-xs !py-2 !px-4"
                >
                  Generate visuals &rsaquo;
                </button>
                {onOpenCitationDrawer && (
                  <button
                    onClick={onOpenCitationDrawer}
                    className="px-3.5 py-2 rounded-full border border-[#E5E7EB] bg-[#F6F6F6] hover:bg-white text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1B98F2]" />
                    <span>Inspect IRDAI Citations</span>
                  </button>
                )}
              </div>
            </div>

            {/* Col 1: Explore */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                Explore
              </h5>
              <ul className="space-y-2 text-xs text-[#52525B]">
                <li>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-[#000000] hover:underline"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-[#000000] hover:underline">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#visuals" className="hover:text-[#000000] hover:underline">
                    Visual Formats
                  </a>
                </li>
                <li>
                  <a href="#faqs" className="hover:text-[#000000] hover:underline">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2: Capabilities & Account */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                Capabilities
              </h5>
              <ul className="space-y-2 text-xs text-[#52525B]">
                <li>
                  <button onClick={onEnterStudio} className="hover:text-[#000000] hover:underline">
                    Diffusion visual engine
                  </button>
                </li>
                <li>
                  <button onClick={onEnterStudio} className="hover:text-[#000000] hover:underline">
                    1024×1024 150 DPI Infographics
                  </button>
                </li>
                <li>
                  <button onClick={onEnterStudio} className="hover:text-[#000000] hover:underline">
                    Cashless Claims Flowcharts
                  </button>
                </li>
                <li>
                  <button onClick={onSignIn} className="hover:text-[#000000] hover:underline">
                    Log in
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-10 mt-8 border-t border-[#E5E7EB] text-xs text-[#9CA3AF] gap-3">
            <p>© 2026 PolicyVision AI. Insurance Explainer Visual Generator.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#158142]" />
              <span className="text-[#17510B] font-medium">Diffusion Ready · 10x Content Production</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
