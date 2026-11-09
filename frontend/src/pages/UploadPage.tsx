import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Download, FileCheck } from 'lucide-react';
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
    setStepLabel('Extracting hierarchical policy tokens via PyMuPDF...');

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
      setStepLabel('Decomposing into three mandatory IRDAI invariants...');

      // Generate 3-section plain language summary
      const expRes = await apiClient.generate.explanation(selectedLanguage, selectedStyle);
      if (!expRes.success) {
        setErrorMsg(expRes.error?.message || 'Simplification failed.');
        setLoading(false);
        return;
      }

      setProgress(80);
      setStepLabel('Synthesizing grounded visual explainers & citations...');

      // Trigger visuals
      await apiClient.generate.coverageVisual(selectedStyle, selectedLanguage);
      await apiClient.generate.claimsVisual(selectedStyle, selectedLanguage);

      setProgress(100);
      setStepLabel('Synthesis complete. Mounting studio...');

      setTimeout(() => {
        setLoading(false);
        onSuccess(docName, selectedLanguage, selectedStyle);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-2">
          Upload Policy Schedule
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Ingest insurance PDF contracts or raw excerpts to generate 100% document-grounded visual infographics across What is Covered, What is Not Covered, and Cashless Claim procedures.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold">Ingestion Notice:</span> {errorMsg}
          </div>
        </div>
      )}

      {loading ? (
        /* Processing HUD */
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-800">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              PIPELINE ACTIVE • {progress}%
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {stepLabel}
            </h2>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 max-w-md mx-auto overflow-hidden border border-slate-200">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-xs border border-slate-200">
            <button
              onClick={() => setActiveMode('pdf')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'pdf'
                  ? 'bg-white text-slate-950 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>PDF Document</span>
            </button>
            <button
              onClick={() => setActiveMode('text')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'text'
                  ? 'bg-white text-slate-950 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Text Excerpt</span>
            </button>
          </div>

          {/* Mode 1: PDF Dropzone */}
          {activeMode === 'pdf' ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('pdf-file-input')?.click()}
                className="bg-white rounded-2xl p-8 sm:p-12 text-center cursor-pointer border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 transition-colors shadow-2xs group relative"
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-3 group-hover:text-orange-600 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-base text-slate-900 mb-1">
                  {selectedFile ? selectedFile.name : 'Select or Drop Policy Schedule (PDF)'}
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  PyMuPDF extraction with table parsing • Up to 50 MB
                </p>
                {selectedFile ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>LOADED ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-orange-600 hover:underline">
                    Browse from your computer
                  </span>
                )}
              </div>

              {/* Quick Sample Policies Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <FileCheck className="w-4 h-4 text-orange-600" />
                    <span>Quick Testing Samples (IRDAI Compliant)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    1-Click load or download test policy files:
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Sample 1: Care Optima */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Care Optima Health Insurance
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Individual • ₹15L Sum Insured • 36mo PED
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSamplePolicy('Care_Optima_Health_Insurance_Policy.pdf', 'Care Optima Health');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors"
                      >
                        Load
                      </button>
                      <a
                        href="/Care_Optima_Health_Insurance_Policy.pdf"
                        download="Care_Optima_Health_Insurance_Policy.pdf"
                        onClick={(e) => e.stopPropagation()}
                        title="Download PDF"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Sample 2: Star Comprehensive */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Star Health Comprehensive Floater
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Family Floater • ₹25L Sum Insured • Restored
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSamplePolicy('Star_Comprehensive_Family_Health_Policy.pdf', 'Star Comprehensive Floater');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors"
                      >
                        Load
                      </button>
                      <a
                        href="/Star_Comprehensive_Family_Health_Policy.pdf"
                        download="Star_Comprehensive_Family_Health_Policy.pdf"
                        onClick={(e) => e.stopPropagation()}
                        title="Download PDF"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
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
            <div className="bg-white rounded-2xl p-6 space-y-3 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Raw Policy Clauses
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  {freeText.length} / 5,000 characters
                </span>
              </div>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Paste insurance policy clauses, coverage limits, inclusions, deductibles, or claim procedures..."
                rows={7}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white resize-none transition-colors font-mono"
              />
              <div className="flex justify-between items-center text-xs">
                <span className={freeText.length < 50 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                  Min: 50 characters required
                </span>
                {freeText.length >= 50 && (
                  <span className="text-emerald-700 font-mono font-semibold">✓ Valid Length</span>
                )}
              </div>
            </div>
          )}

          {/* Configuration Grid: Languages & Visual Styles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Selector */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Output Language
                </label>
                <span className="text-xs font-mono text-slate-500">8 Indic Scripts</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{lang.native}</div>
                    <div className={`text-[10px] ${selectedLanguage === lang.code ? 'text-slate-300' : 'text-slate-500'}`}>
                      {lang.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selector */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Visual Layout Engine
                </label>
                <span className="text-xs font-mono text-slate-500">1024×1024 Canvas</span>
              </div>
              <div className="space-y-2">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === st.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{st.name}</div>
                    <div className={`text-[11px] mt-0.5 ${selectedStyle === st.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {st.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading || (activeMode === 'pdf' ? !selectedFile : freeText.length < 50)}
              className="btn-accent px-6 py-3.5 text-sm font-semibold shadow-sm hover:shadow disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
            >
              <span>Orchestrate Visual Synthesis</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
