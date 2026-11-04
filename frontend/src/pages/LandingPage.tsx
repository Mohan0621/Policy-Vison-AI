import React, { useState, useRef } from 'react';
import {
  Shield, FileText, CheckCircle2, ChevronRight, Sparkles,
  Globe, Layers, Eye, Download, Play, Pause
} from 'lucide-react';

interface LandingPageProps {
  onEnterStudio: () => void;
  onSignIn?: () => void;
  onRegister?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterStudio, onSignIn, onRegister }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

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
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* ── Hero Section (Refreshing light gradient inspired by EvalAI) ── */}
      <section className="w-full min-h-[calc(100vh-80px)] px-6 sm:px-12 lg:px-20 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center bg-gradient-to-br from-orange-50 via-white to-pink-50 relative overflow-hidden">
        {/* Soft background ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="space-y-8 z-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 border border-orange-200 rounded-full px-3.5 py-1.5 bg-orange-50/80 shadow-sm">
            <Sparkles size={13} className="text-orange-500" />
            <span>Introducing PolicyVision AI 2.0 • IRDAI Grounded</span>
          </div>

          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[1.08] text-slate-900 tracking-tight">
            AI-Powered <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
              Insurance Visuals
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed">
            Transform dense 50-page legal contracts into crystal-clear, document-grounded visual infographics with zero hallucinations. Built for insurance underwriters, brokers, and modern policyholders.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onRegister || onEnterStudio}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-base shadow-lg shadow-orange-500/25 hover:opacity-95 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all"
            >
              <span>Get Started Now</span>
              <ChevronRight size={18} />
            </button>
            <button
              onClick={onSignIn || onEnterStudio}
              className="flex items-center gap-2 px-6 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-base hover:bg-slate-50 hover:border-slate-300 shadow-sm transition"
            >
              <Eye size={17} className="text-orange-500" />
              <span>Sign In to Studio</span>
            </button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Zero Hallucinations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>1024×1024 150 DPI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>8 Indian Scripts</span>
            </div>
          </div>
        </div>

        {/* ── Hero Interactive Card / Visual Preview Mockup ── */}
        <div className="relative z-10">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 p-3 sm:p-5">
            {/* Header tag */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Care_Health_Optima_Policy.pdf</p>
                  <p className="text-[10px] text-slate-400">100% Document Grounded • 48 Chunks Indexed</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                ● Ready
              </span>
            </div>

            {/* Live Video Demo Player */}
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative aspect-[12/8] shadow-inner group">
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

              {/* Top floating controls */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-orange-400 border border-white/10 uppercase tracking-wider">
                  Live Synthesis Loop
                </span>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:text-orange-400 border border-white/10 transition-colors"
                  title={isPlaying ? 'Pause Demo' : 'Play Demo'}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>

              {/* Bottom gradient bar info */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Neural Extraction &amp; Visual Compilation
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    PyMuPDF Scanner ➔ Cosine Grounding ➔ 1024×1024 Publication Layout
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onEnterStudio}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 hover:opacity-95 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                >
                  <span>Launch</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Grounding metrics badge */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-base font-extrabold text-slate-900">100%</p>
                <p className="text-[10px] font-semibold text-slate-500">Verified Grounding</p>
              </div>
              <div className="p-2.5 bg-orange-50/60 rounded-xl border border-orange-100">
                <p className="text-base font-extrabold text-orange-600">Grade 6.8</p>
                <p className="text-[10px] font-semibold text-orange-700">Flesch-Kincaid</p>
              </div>
              <div className="p-2.5 bg-pink-50/60 rounded-xl border border-pink-100">
                <p className="text-base font-extrabold text-pink-600">8 Scripts</p>
                <p className="text-[10px] font-semibold text-pink-700">Indic Languages</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="border-y border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-5xl font-extrabold text-slate-900">100%</p>
            <p className="text-base text-slate-600 mt-2 font-medium">Factually Grounded in Policy Passages</p>
          </div>
          <div>
            <p className="text-5xl font-extrabold text-orange-500">1024²</p>
            <p className="text-base text-slate-600 mt-2 font-medium">150 DPI High-Resolution Visual Explainer</p>
          </div>
          <div>
            <p className="text-5xl font-extrabold text-slate-900">&lt; 2.4s</p>
            <p className="text-base text-slate-600 mt-2 font-medium">Average Q&A Retrieval Latency</p>
          </div>
        </div>
      </div>

      {/* ── Core Capabilities ── */}
      <section id="capabilities" className="py-24 max-w-7xl mx-auto px-6 sm:px-12 lg:px-20">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-bold tracking-widest text-orange-600 uppercase">Core Capabilities</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
            Engineered for Grounded Compliance
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            PolicyVision AI combines PDF extraction, vector embeddings, and an infographic compiler to automate insurance policy clarity without sacrificing legal accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: FileText,
              title: '50 MB PDF Extraction',
              desc: 'Parses complex multi-page policy schedules and scanned documents with PyMuPDF and optional OCR fallback.',
            },
            {
              icon: Shield,
              title: 'Three-Section Invariant',
              desc: 'Enforces the mandatory plain-language decomposition: What is Covered, What is Not Covered, and How to Claim.',
            },
            {
              icon: Eye,
              title: 'Infographic Compiler',
              desc: 'Produces publication-ready 1024x1024 PNGs with crisp typography, stat badges, and zero diffusion hieroglyphics.',
            },
            {
              icon: Layers,
              title: '0.15 Semantic Floor RAG',
              desc: 'Strictly bounds cosine similarity to eliminate zero-relevance passage retrieval. Every fact is verified against source text.',
            },
            {
              icon: Globe,
              title: '8 Indian Languages',
              desc: 'Preserves exact monetary limits and waiting periods across Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, and Gujarati.',
            },
            {
              icon: Download,
              title: 'XMP Compliance Metadata',
              desc: 'Embeds document name, policy identifier, and UTC timestamp into exported PNG headers at 150 DPI.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              onClick={onEnterStudio}
              className="group p-8 rounded-2xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all space-y-4 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process Comparison (Traditional vs PolicyVision AI) ── */}
      <section id="workflow" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-widest text-orange-600 uppercase">Comparison</p>
            <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">
              Standardize Insurance Clarity, <br />
              Accelerate Customer Trust
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Customers struggle with 50-page insurance schedules filled with legal exclusions and waiting period clauses. PolicyVision AI transforms dense terms into verified, visual clarity in seconds.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div>
                <p className="font-bold text-slate-900 text-sm">Save Assessor Overhead</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Reduces explanation queries and claims confusion by over 90%.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Consistent Grounding</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">All figures derived directly from policy text without LLM hallucinations.</p>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Traditional Insurance PDF</span>
              <p className="text-sm font-semibold text-slate-700">Dense Legalese &amp; Hidden Exclusions</p>
              <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
                <li>50+ pages of small print legal jargon</li>
                <li>Ambiguous cashless hospital claim timelines</li>
                <li>Hidden sub-limits and waiting periods scattered across clauses</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-orange-500/30 p-6 bg-gradient-to-br from-orange-50/60 to-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">PolicyVision AI Explainer</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">100% Grounded</span>
              </div>
              <p className="text-sm font-bold text-slate-900">Crystal-Clear 3-Section Visual Infographic</p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>What is Covered (Max Sum Insured, Day Care, Network facilities)</li>
                <li>What is NOT Covered (30-day initial &amp; 36-month PED waiting periods)</li>
                <li>How to Claim (3-step directional cashless hospital flowchart)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ready CTA Footer Banner ── */}
      <section id="compliance" className="py-20 px-6 sm:px-12 max-w-7xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-pink-600 p-12 sm:p-16 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to Simplify Your Insurance Policies?
            </h2>
            <p className="text-orange-100 text-base sm:text-lg">
              Upload a policy document or paste a policy excerpt to generate publication-ready visual explainers immediately.
            </p>
            <div className="pt-2">
              <button
                onClick={onEnterStudio}
                className="px-8 py-4 rounded-xl bg-white text-orange-600 font-extrabold text-base shadow-xl hover:bg-orange-50 hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                <span>Launch Policy Studio</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8 px-6 sm:px-12 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-pink-600 text-white font-extrabold text-[10px] flex items-center justify-center">PV</div>
            <span className="font-bold text-slate-800">PolicyVision AI</span>
            <span>• IRDAI Regulatory Grounded Financial Architecture</span>
          </div>
          <div className="flex items-center gap-6">
            <span>150 DPI Standard</span>
            <span>8 Indian Scripts</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
