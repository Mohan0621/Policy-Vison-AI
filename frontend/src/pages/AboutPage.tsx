import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onEnterStudio: () => void;
  onSignIn?: () => void;
  onRegister?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onEnterStudio,
  onRegister,
}) => {
  return (
    <div className="min-h-screen bg-white text-[#000000] font-sans selection:bg-[#CF69E0]/25 pt-24">
      {/* ── About Hero Section ── */}
      <section className="relative w-full serko-hero-bg py-20 px-6 sm:px-12 flex flex-col items-center text-center space-y-5 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-black/[0.08] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B98F2]" />
          <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
            Our Mission & Architecture
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#000000] leading-tight max-w-3xl">
          Bridging the communication gap{' '}
          <span className="horizon-gradient-text">in modern insurance.</span>
        </h1>

        <p className="text-base sm:text-lg text-black/75 max-w-2xl leading-relaxed">
          Insurers write comprehensive policies, but policyholders struggle with 50-page legal contracts. Custom illustration is too slow for every product line. We built PolicyVision to generate verified, beautiful explainer visuals at the speed of thought.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRegister || onEnterStudio}
            className="serko-btn-black !text-sm !py-3 !px-6 flex items-center gap-2"
          >
            <span>Try the Visual Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── The Problem & The Solution Grid ── */}
      <section className="w-full bg-white py-20 px-6 sm:px-12 max-w-5xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              The Reality Today
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#000000]">
              50-page contracts shouldn't stand between people and care.
            </h2>
            <p className="text-sm text-[#71717A] leading-relaxed">
              When a medical emergency strikes, policyholders don’t have time to parse clause Section 4.2.1 for room rent sub-limits or proportionate deduction rules. Misunderstood exclusions lead to disputed claims, customer distress, and regulatory complaints.
            </p>
          </div>

          <div className="p-8 rounded-[24px] bg-[#F6F6F6] border border-[#E5E7EB] space-y-3">
            <h4 className="text-base font-bold text-[#000000]">The Illustration Bottleneck</h4>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
              Insurers want to create visual brochures for every product line, but manual agency design takes 2-3 weeks per product. With hundreds of regional plans and rider options, content production simply cannot keep pace with customer education needs.
            </p>
          </div>
        </div>

        {/* ── The Generative Solution ── */}
        <div className="p-8 sm:p-12 rounded-[28px] bg-[#E8F3FE] border border-[#CFE6FC] space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">
              The Generative Solution
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#000000]">
              Diffusion models trained on insurance grounding.
            </h2>
            <p className="text-sm text-black/75 leading-relaxed max-w-2xl">
              PolicyVision unites deterministic legal text parsing with generative visual diffusion. We extract verified insurance invariants—room rent caps, copays, waiting periods, and cashless emergency pathways—and synthesize publication-ready infographics and flowcharts in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-1.5">
              <h5 className="text-sm font-bold text-[#000000]">100% Document Grounded</h5>
              <p className="text-xs text-[#71717A]">
                Zero hallucinations. Every visual limit is tied directly to legal policy wording.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-1.5">
              <h5 className="text-sm font-bold text-[#000000]">8 Indic Languages</h5>
              <p className="text-xs text-[#71717A]">
                Ensuring equal access to clear policy terms for every citizen nationwide.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-1.5">
              <h5 className="text-sm font-bold text-[#000000]">10x Faster Turnaround</h5>
              <p className="text-xs text-[#71717A]">
                Empowering insurance content teams to produce customer education kits in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing Horizon CTA ── */}
      <section className="w-full serko-cta-bg py-20 px-6 sm:px-12 text-center flex flex-col items-center justify-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#000000]">
          Be there for the policyholders that matter.
        </h2>
        <p className="text-base text-black/70 max-w-lg leading-relaxed">
          Create crystal-clear customer education visual explainers today.
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
