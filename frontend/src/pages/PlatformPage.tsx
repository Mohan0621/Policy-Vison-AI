import React, { useState } from 'react';
import {
  Check, ArrowRight, Sparkles, Lock, Cpu, Shield
} from 'lucide-react';

interface PlatformPageProps {
  onEnterStudio: () => void;
  onSignIn?: () => void;
  onRegister?: () => void;
}

export const PlatformPage: React.FC<PlatformPageProps> = ({
  onEnterStudio,
  onRegister,
}) => {
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const stages = [
    {
      title: '1. Policy Ingestion & Parsing Agent',
      stage: 'Agent 1 of 6',
      desc: 'Parses dense 50-page PDF policy contracts and Customer Information Sheets (CIS) using PyMuPDF, filtering boilerplate legal disclaimers and extracting raw coverage clauses with page numbers.',
      badge: 'Document Parsing',
    },
    {
      title: '2. Invariant Extraction Agent',
      stage: 'Agent 2 of 6',
      desc: 'Isolates 14 critical insurance invariants: room rent caps, ICU restrictions, disease-specific waiting periods, copay percentages, day-care procedures, and cashless hospital rules.',
      badge: 'Clause Classification',
    },
    {
      title: '3. Grounding & Verification Agent',
      stage: 'Agent 3 of 6',
      desc: 'Enforces a strict 0.15 Cosine Similarity semantic floor via FAISS. Every displayed limit or exclusion is matched to an exact sentence in the source contract with zero hallucination.',
      badge: 'Zero Hallucination',
    },
    {
      title: '4. Diffusion Prompt Synthesizer',
      stage: 'Agent 4 of 6',
      desc: 'Translates parsed insurance rules into highly disciplined visual design prompts—specifying high-contrast typography, clear card grids, icon anchors, and semantic color status tokens.',
      badge: 'Prompt Engineering',
    },
    {
      title: '5. Generative Visual Diffusion Agent',
      stage: 'Agent 5 of 6',
      desc: 'Renders crisp 1024×1024 publication-grade infographics and dual-path claims flowcharts at 150 DPI, formatted for both customer mobile screens and print-ready agency brochures.',
      badge: '150 DPI Diffusion',
    },
    {
      title: '6. Multi-Script Indic Localization Agent',
      stage: 'Agent 6 of 6',
      desc: 'Preserves typographical ligatures and native script grammar across 8 Indian languages (Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam) for inclusive customer education.',
      badge: 'Indic Multi-Script',
    },
  ];

  const [sampleIdx, setSampleIdx] = useState(0);
  const sampleProducts = [
    {
      name: 'Care Health Optima',
      policyType: 'Individual Health Insurance',
      sumInsured: '₹15,00,000',
      keyClause: 'Room rent capped at 1% of Sum Insured (₹15,000/day). ICU uncapped. PED waiting period 36 months.',
      promptSpec: 'Executive editorial infographic, corporate high-contrast cards, inclusion pills in emerald, waiting period timeline in amber.',
    },
    {
      name: 'Star Comprehensive Floater',
      policyType: 'Family Floater (4 Members)',
      sumInsured: '₹25,00,000',
      keyClause: 'Maternity cover after 24 months up to ₹1,00,000. 100% automatic sum insured restoration on exhaustion.',
      promptSpec: 'Family health coverage schema, restoration cycle icon, dual-path cashless hospitalization workflow.',
    },
    {
      name: 'HDFC ERGO Optima Secure',
      policyType: 'Comprehensive Health Plan',
      sumInsured: '₹10,00,000',
      keyClause: '2X Instant restoration from Day 1. Consumables non-medical charges covered up to 100%. Zero copay.',
      promptSpec: 'Executive modern visual explainer, cashless network icons, day-care procedure grid with verified citations.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#000000] font-sans selection:bg-[#CF69E0]/25 pt-24">
      {/* ── Platform Hero Section (Soft Blue Halo) ── */}
      <section className="relative w-full serko-hero-bg py-20 px-6 sm:px-12 flex flex-col items-center text-center space-y-5 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-black/[0.08] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B98F2]" />
          <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
            AI-Native Diffusion Platform · Insurance (BFSI)
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#000000] leading-tight max-w-3xl">
          Built around generative diffusion{' '}
          <span className="horizon-gradient-text">from the ground up.</span>
        </h1>

        <p className="text-base sm:text-lg text-black/75 max-w-2xl leading-relaxed">
          Upload policy contracts or Customer Information Sheets (CIS) once. Six specialized agents analyze clauses, enforce document grounding, and synthesize publication-ready 1024×1024 visual explainers in seconds.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRegister || onEnterStudio}
            className="serko-btn-black !text-sm !py-3 !px-6 flex items-center gap-2"
          >
            <span>Launch Visual Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onEnterStudio}
            className="serko-btn-white !text-sm !py-3 !px-6"
          >
            Explore Samples
          </button>
        </div>

        {/* Interactive Platform Live Composer Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-black/[0.08] text-left space-y-5 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
                SELECT SAMPLE POLICY SPECIFICATION
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {sampleProducts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSampleIdx(idx)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      sampleIdx === idx
                        ? 'bg-[#000000] text-white shadow-xs'
                        : 'bg-[#F6F6F6] text-[#71717A] hover:text-[#000000]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold bg-[#C0F2B5] text-[#17510B] px-2.5 py-1 rounded-full">
                100% Grounded
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#000000]">{sampleProducts[sampleIdx].policyType}</span>
              <span className="font-mono text-[#1B98F2] font-semibold">Sum Insured: {sampleProducts[sampleIdx].sumInsured}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F6F6] border border-[#E5E7EB] text-xs text-[#000000] leading-relaxed">
              <span className="font-bold">Extracted Invariant: </span>
              {sampleProducts[sampleIdx].keyClause}
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 leading-relaxed font-mono">
              <span className="font-bold font-sans text-blue-950">Diffusion Prompt Spec: </span>
              {sampleProducts[sampleIdx].promptSpec}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <Sparkles className="w-3.5 h-3.5 text-[#1B98F2]" />
              <span>Synthesized in 2.8s · 150 DPI Canvas</span>
            </div>
            <button
              onClick={onEnterStudio}
              className="serko-btn-black !text-xs !py-2 !px-4"
            >
              Generate This Visual
            </button>
          </div>
        </div>
      </section>

      {/* ── 6-Agent Pipeline Stepper Section ── */}
      <section className="w-full bg-white py-20 px-6 sm:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F6F6] border border-[#E5E7EB]">
            <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
              Autonomous 6-Agent Pipeline
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] tracking-tight">
            How PolicyVision turns text into visual explainers.
          </h2>
          <p className="text-base text-black/70 leading-relaxed">
            Click any agent step below to inspect how it parses, verifies, and synthesizes publication-grade visuals:
          </p>
        </div>

        {/* 2-Column Split: Step List & Detail Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Step Buttons (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            {stages.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStageIdx(idx)}
                className={`w-full text-left p-3.5 px-4 rounded-xl border transition-all text-xs sm:text-sm font-semibold flex items-center justify-between ${
                  activeStageIdx === idx
                    ? 'bg-white border-[#1B98F2] shadow-[0_4px_16px_rgba(27,152,242,0.12)] text-[#000000] translate-x-1'
                    : 'bg-[#F6F6F6] border-transparent text-[#52525B] hover:bg-[#EBEBEB] hover:text-[#000000]'
                }`}
              >
                <span>{st.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#71717A] border border-black/[0.06]">
                  {st.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Right: Active Stage Detail Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#E8F3FE] rounded-[24px] p-8 border border-[#CFE6FC] shadow-[0_12px_32px_rgba(27,152,242,0.08)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold bg-[#C0F2B5] text-[#17510B] px-3 py-1 rounded-full">
                {stages[activeStageIdx].stage}
              </span>
              <span className="text-xs font-mono text-[#0369A1]">
                IRDAI CIS Standard
              </span>
            </div>

            <h3 className="text-2xl font-bold text-[#000000]">
              {stages[activeStageIdx].title}
            </h3>

            <p className="text-base text-black/75 leading-relaxed">
              {stages[activeStageIdx].desc}
            </p>

            <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs text-[#4D4D4D]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#158142]" />
                <span>Deterministic Verification Active</span>
              </div>
              <button
                onClick={onEnterStudio}
                className="serko-btn-black !text-xs !py-2 !px-4"
              >
                Try this agent
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enterprise Security & Isolation Strip ── */}
      <section className="w-full bg-[#F6F6F6] py-16 px-6 sm:px-12 border-t border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-2">
            <Lock className="w-6 h-6 text-[#1B98F2]" />
            <h4 className="text-base font-bold text-[#000000]">Zero Data Retention</h4>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Uploaded policy PDFs are processed in memory and securely purged after session termination. Customer data is never used to train public models.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-2">
            <Cpu className="w-6 h-6 text-[#CF69E0]" />
            <h4 className="text-base font-bold text-[#000000]">1024² 150 DPI Standard</h4>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Diffusion canvases are rendered at ultra-sharp print resolution with embedded XMP metadata tags, guaranteeing publication readiness.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-2">
            <Shield className="w-6 h-6 text-[#158142]" />
            <h4 className="text-base font-bold text-[#000000]">IRDAI CIS Conformance</h4>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Every infographic and flowchart strictly follows regulatory disclosure norms, presenting inclusions, exclusions, and claims without ambiguity.
            </p>
          </div>
        </div>
      </section>

      {/* ── Closing Horizon CTA ── */}
      <section className="w-full serko-cta-bg py-20 px-6 sm:px-12 text-center flex flex-col items-center justify-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#000000]">
          Ready to experience the generative engine?
        </h2>
        <p className="text-base text-black/70 max-w-lg leading-relaxed">
          Upload any policy brochure and generate executive visual explainers in seconds.
        </p>
        <button
          onClick={onRegister || onEnterStudio}
          className="serko-btn-black !text-sm !py-3 !px-7 flex items-center gap-2"
        >
          <span>Launch Policy Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
