import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles, Download, FileCheck } from 'lucide-react';
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

const STYLES: Array<{ id: VisualStyle; name: string; desc: string }> = [
  { id: 'professional_infographic', name: 'Executive Infographic', desc: 'Corporate aesthetic, high-contrast cards, structured typography' },
  { id: 'illustrated_cartoon', name: 'Editorial Illustrated', desc: 'Approachable geometry, rounded motifs, warm accessibility' },
  { id: 'flowchart_diagram', name: 'Procedural Flowchart', desc: 'Dual-path decision nodes, step sequence, verified paths' },
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
      setErrorMsg('Only PDF files are supported. Please convert your document to PDF.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds the 50 MB limit. Please upload a smaller file.');
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

      // Generate 3-section plain language summary
      const expRes = await apiClient.generate.explanation(selectedLanguage, selectedStyle);
      if (!expRes.success) {
        setErrorMsg(expRes.error?.message || 'Simplification failed.');
        setLoading(false);
        return;
      }

      setProgress(80);
      setStepLabel('SYNTHESIZING GROUNDED VISUAL EXPLAINERS...');

      // Trigger visuals
      await apiClient.generate.coverageVisual(selectedStyle, selectedLanguage);
      await apiClient.generate.claimsVisual(selectedStyle, selectedLanguage);

      setProgress(100);
      setStepLabel('ORCHESTRATION COMPLETE. MOUNTING STUDIO...');

      setTimeout(() => {
        setLoading(false);
        onSuccess(docName, selectedLanguage, selectedStyle);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#17510B] border border-[#C0F2B5] rounded-full px-3.5 py-1 bg-[#C0F2B5]/40 mb-4 shadow-xs">
          <Sparkles size={13} className="text-[#17510B]" />
          <span>INSURANCE EXPLAINER VISUAL GENERATOR · BFSI</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#000000] leading-tight mb-4">
          Transform Policy Descriptions into <br />
          <span className="horizon-gradient-text">
            Explainer Visuals via Diffusion.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#71717A] max-w-2xl leading-relaxed">
          Insurers need clear visual explainers for policy products and claims processes. PolicyVision generates print-ready visual infographics and flowchart diagrams directly from policy descriptions in seconds.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-700 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="text-sm">
            <span className="font-bold">Ingestion Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {loading ? (
        /* Processing HUD */
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E7EB] shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-[#F6F6F6] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-6 text-[#000000] shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[#1B98F2]" />
          </div>
          <div className="text-xs font-bold tracking-widest text-[#1B98F2] uppercase mb-2">
            [DIFFUSION PIPELINE ACTIVE]
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-[#000000] mb-3 tracking-tight">
            {stepLabel}
          </h3>
          <p className="text-xs text-[#71717A] mb-8 max-w-md mx-auto">
            Extracting policy clauses, computing semantic floor embeddings, and synthesizing diffusion visual explainers...
          </p>
          <div className="w-full bg-[#F6F6F6] rounded-full h-3 overflow-hidden max-w-lg mx-auto border border-[#E5E7EB]">
            <div
              className="bg-gradient-to-r from-[#1B98F2] via-[#CF69E0] to-[#FF8C51] h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs font-bold text-[#71717A] mt-3">{progress}% COMPLETED</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Mode Switcher Tabs (Serko Pill Track) */}
          <div className="flex items-center space-x-1 p-1 bg-[#F6F6F6] rounded-full max-w-md border border-[#E5E7EB] shadow-inner">
            <button
              onClick={() => setActiveMode('pdf')}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeMode === 'pdf'
                  ? 'bg-white text-[#000000] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-[#71717A] hover:text-[#000000]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>PDF DOCUMENT</span>
            </button>
            <button
              onClick={() => setActiveMode('text')}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeMode === 'text'
                  ? 'bg-white text-[#000000] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-[#71717A] hover:text-[#000000]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>TEXT EXCERPT</span>
            </button>
          </div>

          {/* Mode 1: PDF Dropzone */}
          {activeMode === 'pdf' ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('pdf-file-input')?.click()}
                className="bg-white rounded-3xl p-10 sm:p-14 text-center cursor-pointer border-2 border-dashed border-[#E5E7EB] hover:border-[#1B98F2] hover:bg-[#F6F6F6]/40 transition-all shadow-sm group relative overflow-hidden"
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                />
                <div className="w-16 h-16 rounded-2xl bg-[#F6F6F6] border border-[#E5E7EB] text-[#000000] flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:border-[#1B98F2] transition-all shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-[#000000] mb-2">
                  {selectedFile ? selectedFile.name : 'Select or Drop Policy PDF'}
                </h3>
                <p className="text-xs text-[#71717A] max-w-sm mx-auto mb-4">
                  Full PyMuPDF parser + OCR fallback hook • Up to 50 MB / 100 Pages
                </p>
                {selectedFile ? (
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#C0F2B5] text-[#17510B] text-xs font-bold shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#17510B]" />
                    <span>LOADED ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-[#1B98F2] hover:underline">
                    Click to browse from your device
                  </span>
                )}
              </div>

              {/* Quick Sample Policies Bar */}
              <div className="bg-[#F6F6F6] border border-[#E5E7EB] rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#000000] uppercase tracking-wider">
                    <FileCheck className="w-4 h-4 text-[#1B98F2]" />
                    <span>Quick Testing Samples (IRDAI Compliant)</span>
                  </div>
                  <span className="text-[11px] text-[#71717A]">
                    No policy on hand? 1-click load or download test documents:
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Sample 1: Care Optima */}
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-[#1B98F2]/50 transition-colors">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#000000] truncate">
                        Care Optima Health Insurance
                      </div>
                      <div className="text-[11px] text-[#71717A] mt-0.5">
                        Individual • ₹15L Sum Insured • PED 36mo • Cashless
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSamplePolicy('Care_Optima_Health_Insurance_Policy.pdf', 'Care Optima Health');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#000000] hover:bg-zinc-800 text-white transition-colors"
                      >
                        Load Sample
                      </button>
                      <a
                        href="/Care_Optima_Health_Insurance_Policy.pdf"
                        download="Care_Optima_Health_Insurance_Policy.pdf"
                        onClick={(e) => e.stopPropagation()}
                        title="Download PDF"
                        className="p-1.5 text-[#71717A] hover:text-[#000000] rounded-full hover:bg-[#F6F6F6] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Sample 2: Star Comprehensive */}
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-[#1B98F2]/50 transition-colors">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#000000] truncate">
                        Star Health Comprehensive Floater
                      </div>
                      <div className="text-[11px] text-[#71717A] mt-0.5">
                        Family Floater (4 Members) • ₹25L Sum Insured • Restored
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSamplePolicy('Star_Comprehensive_Family_Health_Policy.pdf', 'Star Comprehensive Floater');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#000000] hover:bg-zinc-800 text-white transition-colors"
                      >
                        Load Sample
                      </button>
                      <a
                        href="/Star_Comprehensive_Family_Health_Policy.pdf"
                        download="Star_Comprehensive_Family_Health_Policy.pdf"
                        onClick={(e) => e.stopPropagation()}
                        title="Download PDF"
                        className="p-1.5 text-[#71717A] hover:text-[#000000] rounded-full hover:bg-[#F6F6F6] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Text Editor */
            <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-3 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                  Raw Policy Specification
                </label>
                <span className="text-xs text-[#71717A]">
                  {freeText.length} / 5,000 characters
                </span>
              </div>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Paste insurance policy excerpt, coverage limits, inclusions, deductibles, or claim procedures..."
                rows={7}
                className="w-full bg-[#F6F6F6] border border-[#E5E7EB] rounded-2xl p-4 text-xs sm:text-sm text-[#000000] focus:outline-none focus:bg-white focus:border-[#1B98F2] focus:ring-2 focus:ring-[#1B98F2]/20 resize-none transition-colors"
              />
              <div className="flex justify-between items-center text-xs">
                <span
                  className={
                    freeText.length < 50 || freeText.length > 5000
                      ? 'text-[#EA580C] font-medium'
                      : 'text-[#71717A]'
                  }
                >
                  Min: 50 characters required
                </span>
                {freeText.length >= 50 && freeText.length <= 5000 && (
                  <span className="text-[#158142] font-bold">✓ Valid Token Length</span>
                )}
              </div>
            </div>
          )}

          {/* Configuration Grid: Languages & Visual Styles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Language Selector */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                  Output Language Specification
                </label>
                <span className="text-xs font-bold text-[#1B98F2]">8 Indic Scripts</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-[#000000] bg-[#F6F6F6] text-[#000000] shadow-sm ring-1 ring-black'
                        : 'border-[#E5E7EB] bg-white hover:bg-[#F6F6F6] text-[#4D4D4D]'
                    }`}
                  >
                    <div className="font-bold text-sm">{lang.native}</div>
                    <div className="text-[11px] text-[#71717A]">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selector */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                  Visual Engine Rendering Style
                </label>
                <span className="text-xs font-bold text-[#1B98F2]">1024×1024 Canvas</span>
              </div>
              <div className="space-y-2.5">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      selectedStyle === st.id
                        ? 'border-[#000000] bg-[#F6F6F6] text-[#000000] shadow-sm ring-1 ring-black'
                        : 'border-[#E5E7EB] bg-white hover:bg-[#F6F6F6] text-[#4D4D4D]'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#000000]">{st.name}</div>
                    <div className="text-xs text-[#71717A] mt-0.5">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || (activeMode === 'pdf' ? !selectedFile : freeText.length < 50)}
              className="serko-btn-black !text-base !py-3.5 !px-8 flex items-center space-x-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Orchestrate Visual Synthesis</span>
              <ArrowRight className="w-4 h-4 ml-1 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
