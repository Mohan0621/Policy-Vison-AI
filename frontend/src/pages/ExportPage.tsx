import React, { useState, useEffect } from 'react';
import { Download, FileArchive, CheckCircle2, AlertTriangle, RefreshCw, Image as ImageIcon, Sparkles } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#17510B] border border-[#C0F2B5] rounded-full px-3 py-1 bg-[#C0F2B5]/40 mb-3 shadow-xs">
          <Sparkles size={12} className="text-[#17510B]" />
          <span>ASSET PACKAGING & EXPORT SUITE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] tracking-tight">
          Artifact Delivery Suite<span className="text-[#1B98F2]">.</span>
        </h2>
        <p className="text-sm text-[#71717A] mt-1">
          1024×1024 Print-Ready PNGs (150 DPI) with embedded XMP metadata & structured summary archives.
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
                className="mt-2 text-xs font-bold text-[#1B98F2] underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Retry ZIP Bundle</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Bundle ZIP Action Card */}
      <div className="rounded-3xl p-8 border border-[#E5E7EB] bg-[#F6F6F6] shadow-sm relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E7EB] text-[#000000] flex items-center justify-center flex-shrink-0 shadow-xs">
              <FileArchive className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1B98F2] uppercase tracking-wider mb-1">
                Complete Bundle Archive
              </div>
              <h3 className="font-bold text-xl text-[#000000] tracking-tight">
                Complete Session Package (.ZIP)
              </h3>
              <p className="text-xs text-[#71717A] mt-1 max-w-md">
                Includes all generated high-res visual explainers, embedded XMP metadata tags, and plain-language PDF summary.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="serko-btn-black !text-sm !py-3.5 !px-8 flex items-center justify-center space-x-2 flex-shrink-0 disabled:opacity-50"
          >
            {isDownloadingZip ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>ARCHIVING ASSETS...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>DOWNLOAD ZIP BUNDLE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Asset Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#000000]">
          Individual Asset Downloads
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Coverage Infographic */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#F6F6F6] border border-[#E5E7EB] text-[#000000] flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#000000] text-sm">Coverage Infographic (PNG)</h4>
                <p className="text-xs text-[#71717A]">1024×1024 • 150 DPI • XMP Embedded</p>
              </div>
            </div>
            <a
              href={visuals.length > 0 ? apiClient.export.getImageUrl(visuals[0].image_id) : '/coverage_infographic_explainer.png'}
              download="Coverage_Infographic.png"
              className="px-4 py-2 rounded-full bg-[#000000] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>

          {/* Card 2: Claims Flowchart */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#F6F6F6] border border-[#E5E7EB] text-[#000000] flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#000000] text-sm">Claims Flowchart (PNG)</h4>
                <p className="text-xs text-[#71717A]">1024×1024 • 150 DPI • Dual-Path Schema</p>
              </div>
            </div>
            <a
              href={visuals.length > 1 ? apiClient.export.getImageUrl(visuals[1].image_id) : '/claims_flowchart_explainer.png'}
              download="Claims_Flowchart.png"
              className="px-4 py-2 rounded-full bg-[#000000] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
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
