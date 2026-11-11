import React from 'react';
import {
  ArrowRight, Users, Building, FileCheck, Smartphone, Printer, Globe, Download
} from 'lucide-react';

interface ForTeamsPageProps {
  onEnterStudio: () => void;
  onSignIn?: () => void;
  onRegister?: () => void;
}

export const ForTeamsPage: React.FC<ForTeamsPageProps> = ({
  onEnterStudio,
  onRegister,
}) => {
  return (
    <div className="min-h-screen bg-white text-[#000000] font-sans selection:bg-[#CF69E0]/25 pt-24">
      {/* ── For Teams Hero Section ── */}
      <section className="relative w-full serko-hero-bg py-20 px-6 sm:px-12 flex flex-col items-center text-center space-y-5 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-black/[0.08] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B98F2]" />
          <span className="text-[11.5px] uppercase font-bold tracking-[0.9px] text-[#4D4D4D]">
            PolicyVision for Insurers & Enterprises
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#000000] leading-tight max-w-3xl">
          Content production at scale{' '}
          <span className="horizon-gradient-text">for insurance leaders.</span>
        </h1>

        <p className="text-base sm:text-lg text-black/75 max-w-2xl leading-relaxed">
          Custom illustration for every insurance product line is slow and costly. PolicyVision equips marketing, underwriting, and broker distribution teams to generate customer education visuals across thousands of policies in seconds.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRegister || onEnterStudio}
            className="serko-btn-black !text-sm !py-3 !px-6 flex items-center gap-2"
          >
            <span>Start Enterprise Pilot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onEnterStudio}
            className="serko-btn-white !text-sm !py-3 !px-6"
          >
            Open Interactive Studio
          </button>
        </div>
      </section>

      {/* ── Enterprise Value Pillars ── */}
      <section className="w-full bg-white py-20 px-6 sm:px-12 max-w-6xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-[24px] bg-[#F6F6F6] border border-[#E5E7EB] space-y-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#1B98F2]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#000000]">Marketing & Product Teams</h3>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
              Launch new insurance riders, health floater plans, or senior citizen packages without waiting 3 weeks for graphic agencies. Produce full-fidelity customer education brochures on Day 1.
            </p>
          </div>

          <div className="p-8 rounded-[24px] bg-[#F6F6F6] border border-[#E5E7EB] space-y-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#CF69E0]">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#000000]">Broker & Agent Distribution</h3>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
              Empower 10,000+ field insurance advisors with instant visual selling aids. One-click generation of localized infographics in 8 Indian languages directly on mobile devices.
            </p>
          </div>

          <div className="p-8 rounded-[24px] bg-[#F6F6F6] border border-[#E5E7EB] space-y-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#158142]">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#000000]">Underwriting & Claims Desks</h3>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
              Drastically cut claim dispute volumes by giving policyholders crystal-clear, step-by-step cashless admission flowcharts that specify exact 24h emergency and 48h planned timelines.
            </p>
          </div>
        </div>

        {/* ── Multi-Channel Output Capabilities ── */}
        <div className="p-8 sm:p-12 rounded-[28px] bg-[#E8F3FE] border border-[#CFE6FC] space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">
              Omnichannel Asset Delivery
            </span>
            <h2 className="text-3xl font-bold text-[#000000]">
              One policy input. Every channel visual ready.
            </h2>
            <p className="text-sm text-black/70 leading-relaxed">
              PolicyVision automatically exports multiple aspect ratios and file specifications from a single policy description:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-2">
              <Smartphone className="w-5 h-5 text-[#1B98F2]" />
              <h4 className="text-sm font-bold text-[#000000]">Customer Mobile Apps</h4>
              <p className="text-xs text-[#71717A]">
                High-density mobile infographics formatted for onboarding screens and policy portals.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-2">
              <Printer className="w-5 h-5 text-[#CF69E0]" />
              <h4 className="text-sm font-bold text-[#000000]">Print-Ready Brochures</h4>
              <p className="text-xs text-[#71717A]">
                150 DPI CMYK-compatible PNGs ready for physical policy document welcome kits.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-2">
              <Globe className="w-5 h-5 text-[#158142]" />
              <h4 className="text-sm font-bold text-[#000000]">8 Indic Languages</h4>
              <p className="text-xs text-[#71717A]">
                Native Hindi, Tamil, Telugu, and Bengali visuals for pan-India regional policyholders.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#CFE6FC] space-y-2">
              <Download className="w-5 h-5 text-[#FF8C51]" />
              <h4 className="text-sm font-bold text-[#000000]">Packaged ZIP Bundles</h4>
              <p className="text-xs text-[#71717A]">
                Complete campaign archives with embedded XMP metadata and compliance verification audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing Horizon CTA ── */}
      <section className="w-full serko-cta-bg py-20 px-6 sm:px-12 text-center flex flex-col items-center justify-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#000000]">
          Equip your insurance team today.
        </h2>
        <p className="text-base text-black/70 max-w-lg leading-relaxed">
          Speed customer education content production 10x with PolicyVision.
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
