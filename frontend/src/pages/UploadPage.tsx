import React, { useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, Loader2, Sparkles, Download, FileCheck, Check
} from 'lucide-react';
import { apiClient, IndianLanguage, VisualStyle } from '../api/client';

interface UploadPageProps {
  onSuccess: (docName: string, lang: IndianLanguage, style: VisualStyle) => void;
}

const LANGUAGES: Array<{ code: IndianLanguage; name: string; native: string }> = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
];

const STYLES: Array<{ id: VisualStyle; name: string; desc: string; badge: string }> = [
  {
    id: 'professional_infographic',
    name: 'Executive Infographic',
    desc: 'Corporate aesthetic, high-contrast cards & structured metrics',
    badge: 'Recommended',
  },
  {
    id: 'illustrated_cartoon',
    name: 'Editorial Illustrated',
    desc: 'Approachable geometry, rounded motifs & warm consumer accessibility',
    badge: 'Accessible',
  },
  {
    id: 'flowchart_diagram',
    name: 'Procedural Flowchart',
    desc: 'Dual-path decision nodes, claims sequence & verified checkpoints',
    badge: 'Claims Process',
  },
];

export const UploadPage: React.FC<UploadPageProps> = ({ onSuccess }) => {
  const [activeMode, setActiveMode] = useState<'pdf' | 'text'>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [freeText, setFreeText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguage>('en');
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('professional_infographic');

  const [loading, setLoading] = useState(false);
  const [stepLabel, setStepLabel] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are supported. Please select an insurance policy PDF.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50 MB limit. Please upload a smaller document.');
      return;
    }
    setSelectedFile(file);
  };

  const loadSamplePolicy = async (filename: string, displayName: string) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/${filename}`);
      if (!res.ok) throw new Error('Could not fetch sample file');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'application/pdf' });
      setSelectedFile(file);
    } catch (err: any) {
      setErrorMsg(`Failed to load ${displayName}: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);
    setProgress(20);
    setStepLabel('EXTRACTING HIERARCHICAL POLICY TOKENS...');

    try {
      let docName = 'Insurance Policy';

      if (activeMode === 'pdf') {
        if (!selectedFile) {
          setErrorMsg('Please select a PDF file to upload.');
          setLoading(false);
          return;
        }
        const res = await apiClient.documents.upload(selectedFile);
        if (!res.success || !res.data) {
          setErrorMsg(res.error?.message || 'Upload failed.');
          setLoading(false);
          return;
        }
        docName = res.data.document_name;
      } else {
        if (freeText.trim().length < 50) {
          setErrorMsg('Please enter at least 50 characters of policy text.');
          setLoading(false);
          return;
        }
        const res = await apiClient.documents.submitText(freeText);
        if (!res.success || !res.data) {
          setErrorMsg(res.error?.message || 'Text submission failed.');
          setLoading(false);
          return;
        }
        docName = 'Plain Text Policy';
      }

      setProgress(50);
      setStepLabel('EXTRACTING PASSAGES & GENERATING SIMPLIFIED SUMMARY...');

      const expRes = await apiClient.generate.explanation(selectedLanguage, selectedStyle);
      if (!expRes.success) {
        setErrorMsg(expRes.error?.message || 'Simplification failed.');
        setLoading(false);
        return;
      }

      setProgress(75);
      setStepLabel('SYNTHESIZING GROUNDED VISUAL EXPLAINERS (AI CANVAS)...');

      const covRes = await apiClient.generate.coverageVisual(selectedStyle, selectedLanguage);
      const claimRes = await apiClient.generate.claimsVisual(selectedStyle, selectedLanguage);

      const covTaskId = covRes.data?.task_id;
      const claimTaskId = claimRes.data?.task_id;

      let covDone = !covTaskId;
      let claimDone = !claimTaskId;
      let attempts = 0;

      while ((!covDone || !claimDone) && attempts < 25) {
        attempts++;
        await new Promise((r) => setTimeout(r, 800));

        if (!covDone && covTaskId) {
          const st = await apiClient.generate.getTaskStatus(covTaskId);
          if (st.success && (st.data?.status === 'complete' || st.data?.status === 'failed')) {
            covDone = true;
          }
        }

        if (!claimDone && claimTaskId) {
          const st = await apiClient.generate.getTaskStatus(claimTaskId);
          if (st.success && (st.data?.status === 'complete' || st.data?.status === 'failed')) {
            claimDone = true;
          }
        }

        setProgress(Math.min(98, 75 + Math.floor((attempts / 25) * 23)));
      }

      setProgress(100);
      setStepLabel('ORCHESTRATION COMPLETE. MOUNTING STUDIO...');

      setTimeout(() => {
        setLoading(false);
        onSuccess(docName, selectedLanguage, selectedStyle);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const isFormValid = activeMode === 'pdf' ? !!selectedFile : freeText.trim().length >= 50;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#158142] border border-emerald-200 rounded-full px-3 py-0.5 bg-emerald-50 mb-2">
            <Sparkles size={12} className="text-[#158142]" />
            <span>IRDAI BFSI • 150 DPI DIFFUSION SYNTHESIS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] tracking-tight">
            Policy Ingestion & Synthesis
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-0.5">
            Select or drag an insurance policy PDF, choose target Indic script, and synthesize visual explainers.
          </p>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center space-x-1 p-1 bg-[#F4F4F5] rounded-full border border-[#E4E4E7] shadow-inner shrink-0">
          <button
            onClick={() => setActiveMode('pdf')}
            className={`py-1.5 px-4 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === 'pdf'
                ? 'bg-white text-[#09090B] shadow-xs'
                : 'text-[#71717A] hover:text-[#09090B]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>PDF Document</span>
          </button>
          <button
            onClick={() => setActiveMode('text')}
            className={`py-1.5 px-4 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === 'text'
                ? 'bg-white text-[#09090B] shadow-xs'
                : 'text-[#71717A] hover:text-[#09090B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text Excerpt</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-700 shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Ingestion Alert:</span> {errorMsg}
          </div>
        </div>
      )}

      {loading ? (
        /* Processing HUD */
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#E5E7EB] shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center mx-auto mb-5 text-[#0284C7] shadow-md">
            <Loader2 className="w-8 h-8 animate-spin text-[#0284C7]" />
          </div>
          <div className="text-[11px] font-bold tracking-widest text-[#1B98F2] uppercase mb-1.5">
            [AI SYNTHESIS RUNNING]
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-[#09090B] mb-2 tracking-tight">
            {stepLabel}
          </h3>
          <p className="text-xs text-[#71717A] mb-6 max-w-md mx-auto">
            Extracting policy clauses, grounding citations against IRDAI guidelines, and synthesizing diffusion explainers...
          </p>
          <div className="w-full bg-[#F4F4F5] rounded-full h-2.5 overflow-hidden max-w-md mx-auto border border-[#E4E4E7]">
            <div
              className="bg-gradient-to-r from-[#1B98F2] via-[#CF69E0] to-[#FF8C51] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs font-mono font-bold text-[#71717A] mt-3">{progress}% COMPLETED</div>
        </div>
      ) : (
        /* Modern 2-Column Studio Workbench */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Input & Test Samples (Col 7) */}
          <div className="lg:col-span-7 space-y-5">
            {activeMode === 'pdf' ? (
              <div className="space-y-4">
                {/* Dropzone Card */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById('pdf-file-input')?.click()}
                  className={`bg-white rounded-2xl p-6 sm:p-8 text-center cursor-pointer border-2 border-dashed transition-all shadow-xs group relative ${
                    selectedFile
                      ? 'border-[#158142] bg-emerald-50/20'
                      : 'border-[#E4E4E7] hover:border-[#1B98F2] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <input
                    id="pdf-file-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#158142] flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-[#09090B] max-w-md truncate mb-1">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-[#71717A] mb-3">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Ready for Ingestion
                      </div>
                      <span className="text-xs text-[#1B98F2] hover:underline font-semibold">
                        Click to change document
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 group-hover:border-[#1B98F2] group-hover:text-[#1B98F2] transition-all">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-[#09090B] mb-1">
                        Select or Drop Policy PDF
                      </h3>
                      <p className="text-xs text-[#71717A] max-w-sm mx-auto mb-2">
                        PyMuPDF Parser + Multi-Pass Clause Extractor • Up to 50 MB
                      </p>
                      <span className="text-xs font-semibold text-[#1B98F2] hover:underline">
                        Browse files from your device
                      </span>
                    </div>
                  )}
                </div>

                {/* 1-Click IRDAI Test Samples */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#09090B]">
                      <FileCheck className="w-4 h-4 text-[#1B98F2]" />
                      <span>1-Click Benchmark Test Documents (IRDAI Compliant)</span>
                    </div>
                    <span className="text-[11px] text-[#71717A] hidden sm:inline">
                      Instant testing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sample 1: Care Optima */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between hover:border-[#1B98F2]/60 transition-colors">
                      <div className="mb-2">
                        <div className="text-xs font-bold text-[#09090B] truncate">
                          Care Optima Health
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                          ₹15L Sum Insured • PED 36mo • Cashless Network
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => loadSamplePolicy('Care_Optima_Health_Insurance_Policy.pdf', 'Care Optima')}
                          className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1B98F2] hover:bg-[#1580CD] text-white transition-colors shadow-2xs"
                        >
                          Load Sample
                        </button>
                        <a
                          href="/Care_Optima_Health_Insurance_Policy.pdf"
                          download="Care_Optima_Health_Insurance_Policy.pdf"
                          title="Download PDF"
                          className="p-1 text-[#64748B] hover:text-[#09090B] rounded-md hover:bg-zinc-200 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Sample 2: Star Comprehensive */}
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between hover:border-[#1B98F2]/60 transition-colors">
                      <div className="mb-2">
                        <div className="text-xs font-bold text-[#09090B] truncate">
                          Star Health Floater
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                          Family Floater • ₹25L Sum Insured • Auto-Restored
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => loadSamplePolicy('Star_Comprehensive_Family_Health_Policy.pdf', 'Star Comprehensive')}
                          className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1B98F2] hover:bg-[#1580CD] text-white transition-colors shadow-2xs"
                        >
                          Load Sample
                        </button>
                        <a
                          href="/Star_Comprehensive_Family_Health_Policy.pdf"
                          download="Star_Comprehensive_Family_Health_Policy.pdf"
                          title="Download PDF"
                          className="p-1 text-[#64748B] hover:text-[#09090B] rounded-md hover:bg-zinc-200 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Text Input Mode */
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#09090B] uppercase tracking-wider">
                    Raw Policy Wording
                  </label>
                  <span className="text-xs font-mono text-[#71717A]">
                    {freeText.length} / 5,000 chars
                  </span>
                </div>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Paste insurance policy text, room rent limits, pre-existing conditions, copay terms, or claim filing instructions..."
                  rows={9}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs sm:text-sm text-[#09090B] focus:outline-none focus:bg-white focus:border-[#1B98F2] focus:ring-2 focus:ring-[#1B98F2]/20 resize-none transition-colors"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className={freeText.length < 50 ? 'text-[#EA580C] font-medium' : 'text-[#71717A]'}>
                    Min 50 characters required
                  </span>
                  {freeText.length >= 50 && (
                    <span className="text-[#158142] font-bold">✓ Ready for Parsing</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Language, Style & Synthesize CTA (Col 5) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Language Grid */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-[#09090B] uppercase tracking-wider">
                  Target Language Script
                </div>
                <span className="text-[10px] font-bold text-[#1B98F2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  8 Indic Scripts
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#1B98F2] bg-[#1B98F2]/10 text-[#09090B] shadow-2xs ring-1 ring-[#1B98F2]'
                          : 'border-[#E4E4E7] bg-white hover:bg-[#F8FAFC] text-[#3F3F46]'
                      }`}
                    >
                      <div className="font-bold text-xs">{lang.native}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-[#1B98F2] font-semibold' : 'text-[#71717A]'}`}>
                        {lang.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Visual Style */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-[#09090B] uppercase tracking-wider">
                  Visual Engine Aesthetic
                </div>
                <span className="text-[10px] font-mono text-[#71717A]">
                  1024×1024 150 DPI
                </span>
              </div>
              <div className="space-y-2">
                {STYLES.map((st) => {
                  const isSelected = selectedStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-[#1B98F2] bg-[#1B98F2]/5 text-[#09090B] shadow-2xs ring-1 ring-[#1B98F2]'
                          : 'border-[#E4E4E7] bg-white hover:bg-[#F8FAFC] text-[#3F3F46]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#09090B]">
                            {st.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            isSelected ? 'bg-[#1B98F2] text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {st.badge}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#52525B]' : 'text-[#71717A]'}`}>
                          {st.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#1B98F2] shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Action Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1B98F2] uppercase tracking-wider">
                  Synthesis Pipeline Ready
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs font-semibold text-[#09090B] mb-4 truncate">
                {activeMode === 'pdf'
                  ? selectedFile
                    ? `File: ${selectedFile.name}`
                    : 'Awaiting PDF document selection'
                  : `Raw Text: ${freeText.length} characters`}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !isFormValid}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1B98F2] to-[#7928CA] hover:from-[#1580CD] hover:to-[#631EA8] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Orchestrate Visual Synthesis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
