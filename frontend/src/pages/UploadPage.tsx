import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
        <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 border border-orange-200 rounded-full px-3.5 py-1.5 bg-orange-50 mb-4 shadow-sm">
          <Sparkles size={13} className="text-orange-500" />
          <span>INGESTION & VISUAL SYNTHESIS STUDIO</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
          Transform Policies into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
            Crystal-Clear Visuals.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Upload 50-page complex insurance contracts and convert them into 100% document-grounded, human-readable infographics with instant verification.
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
        <div className="bg-white rounded-3xl p-12 text-center border border-orange-200 shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-6 text-orange-600 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <div className="text-xs font-bold tracking-widest text-orange-600 uppercase mb-2">
            [PIPELINE ACTIVE]
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mb-3 tracking-tight">
            {stepLabel}
          </h3>
          <p className="text-xs text-slate-500 mb-8 max-w-md mx-auto">
            Extracting policy clauses, computing cosine similarity embeddings, and compiling visual assets...
          </p>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden max-w-lg mx-auto border border-slate-200">
            <div
              className="bg-gradient-to-r from-orange-500 to-pink-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs font-bold text-slate-500 mt-3">{progress}% COMPLETED</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-2 p-1.5 bg-white rounded-2xl max-w-md border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveMode('pdf')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeMode === 'pdf'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>PDF DOCUMENT</span>
            </button>
            <button
              onClick={() => setActiveMode('text')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeMode === 'text'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>TEXT EXCERPT</span>
            </button>
          </div>

          {/* Mode 1: PDF Dropzone */}
          {activeMode === 'pdf' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('pdf-file-input')?.click()}
              className="bg-white rounded-3xl p-10 sm:p-14 text-center cursor-pointer border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/20 transition-all shadow-sm group relative overflow-hidden"
            >
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:border-orange-300 transition-all shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2">
                {selectedFile ? selectedFile.name : 'Select or Drop Policy PDF'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Full PyMuPDF parser + OCR fallback hook • Up to 50 MB / 100 Pages
              </p>
              {selectedFile ? (
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>LOADED ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-orange-600 hover:underline">
                  Click to browse from your device
                </span>
              )}
            </div>
          ) : (
            /* Mode 2: Text Editor */
            <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-3 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Raw Policy Specification
                </label>
                <span className="text-xs text-slate-500">
                  {freeText.length} / 5,000 characters
                </span>
              </div>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Paste insurance policy excerpt, coverage limits, inclusions, deductibles, or claim procedures..."
                rows={7}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none transition-colors"
              />
              <div className="flex justify-between items-center text-xs">
                <span
                  className={
                    freeText.length < 50 || freeText.length > 5000
                      ? 'text-amber-600 font-medium'
                      : 'text-slate-500'
                  }
                >
                  Min: 50 characters required
                </span>
                {freeText.length >= 50 && freeText.length <= 5000 && (
                  <span className="text-emerald-600 font-bold">✓ Valid Token Length</span>
                )}
              </div>
            </div>
          )}

          {/* Configuration Grid: Languages & Visual Styles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Language Selector */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Output Language Specification
                </label>
                <span className="text-xs font-bold text-orange-600">8 Indic Scripts</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-orange-500 bg-orange-50/70 text-orange-900 shadow-sm ring-1 ring-orange-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{lang.native}</div>
                    <div className="text-[11px] text-slate-500">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selector */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Visual Engine Rendering Style
                </label>
                <span className="text-xs font-bold text-orange-600">1024×1024 Canvas</span>
              </div>
              <div className="space-y-2.5">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      selectedStyle === st.id
                        ? 'border-orange-500 bg-orange-50/70 text-orange-900 shadow-sm ring-1 ring-orange-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">{st.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{st.desc}</div>
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
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-base shadow-lg shadow-orange-500/25 hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center space-x-2"
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
