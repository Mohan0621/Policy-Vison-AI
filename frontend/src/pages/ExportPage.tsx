import React, { useState, useEffect } from 'react';
import { Download, FileArchive, CheckCircle2, AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../api/client';

export const ExportPage: React.FC = () => {
  const [visuals, setVisuals] = useState<Array<{ image_id: string; type: string }>>([]);
  const [docName, setDocName] = useState<string>('Policy_Document.pdf');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await apiClient.session.get();
        if (res.success && res.data) {
          if (res.data.visual_explainers) {
            setVisuals(res.data.visual_explainers);
          }
          if (res.data.policy_document?.filename) {
            setDocName(res.data.policy_document.filename);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSession();
  }, []);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const blob = await apiClient.export.downloadZip();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PolicyVision_${docName.replace(/\.[^/.]+$/, '')}_Assets.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('Complete session bundle successfully assembled and downloaded.');
      setRetryCount(0);
    } catch (err: any) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      if (nextRetry >= 3) {
        setErrorMessage('Export failure: 3 retries exhausted. Check session state or export individual assets.');
      } else {
        setErrorMessage(`Bundle creation failed. Retrying (attempt ${nextRetry} of 3)...`);
      }
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Clinia Header */}
      <div className="border-b border-[#ECD9B9] pb-6 space-y-1">
        <div className="font-mono text-xs uppercase tracking-wider text-[#FF5C00] font-semibold">
          Context Engine Export Suite
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-normal tracking-tight text-[#1A1A1E]">
          Artifact delivery suite
        </h1>
        <p className="text-sm text-[#53402C] mt-1">
          1024×1024 Print-Ready PNGs (150 DPI) with embedded XMP compliance metadata &amp; structured summary archives.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-start space-x-2.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            {retryCount < 3 && (
              <button
                onClick={handleDownloadZip}
                className="mt-2 text-xs font-bold text-orange-600 underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Retry ZIP Bundle</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Bundle ZIP Action Card (Clinia style) */}
      <div className="card-clinia p-8 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start space-x-5">
            <div className="w-14 h-14 rounded-full bg-[#FCF8EF] border border-[#ECD9B9] text-[#FF5C00] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <FileArchive className="w-7 h-7" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-[#FF5C00] font-semibold mb-1">
                Complete Bundle Archive
              </div>
              <h3 className="font-editorial text-2xl font-normal text-[#1A1A1E]">
                Complete Session Package (.ZIP)
              </h3>
              <p className="text-xs text-[#53402C] mt-1 max-w-md">
                Includes all generated high-res visual explainers, embedded XMP metadata tags, and plain-language PDF summary.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="btn-clinia-vital py-3 px-6 text-xs font-mono uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            {isDownloadingZip ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ARCHIVING ASSETS...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download ZIP Bundle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Asset Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800">
          Individual Asset Downloads
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Coverage Infographic */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Coverage Infographic (PNG)</h4>
                <p className="text-xs text-slate-500">1024×1024 • 150 DPI • XMP Embedded</p>
              </div>
            </div>
            <a
              href={visuals.length > 0 ? apiClient.export.getImageUrl(visuals[0].image_id) : '/clean_policy_infographic.png'}
              download="Coverage_Infographic.png"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>

          {/* Card 2: Claims Flowchart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Claims Flowchart (PNG)</h4>
                <p className="text-xs text-slate-500">1024×1024 • 150 DPI • Dual-Path Schema</p>
              </div>
            </div>
            <a
              href={visuals.length > 1 ? apiClient.export.getImageUrl(visuals[1].image_id) : '/clean_policy_infographic.png'}
              download="Claims_Flowchart.png"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
