import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';
import { SourceCitation } from '../../api/client';

interface ClauseSnippetCardProps {
  citation: SourceCitation;
  index: number;
  onOpenDrawer?: () => void;
}

export const ClauseSnippetCard: React.FC<ClauseSnippetCardProps> = ({
  citation,
  index,
  onOpenDrawer,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceScore = Math.round((citation.relevance_score || 0.92) * 100);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(citation.passage_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#FAFAFA] hover:bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] transition-all duration-200 group shadow-2xs hover:shadow-xs space-y-2">
      {/* Top Meta Line */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-full bg-[#E8F3FE] text-[#1B98F2] flex items-center justify-center text-[10px] font-bold shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-[#000000] truncate">
            {citation.section_heading || 'Policy Clause'}
          </span>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[10px] font-bold text-[#166534] shrink-0">
          <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
          <span>{confidenceScore}% Match</span>
        </div>
      </div>

      {/* Document info tag */}
      <div className="flex items-center gap-2 text-[10px] text-[#71717A]">
        <span className="font-semibold text-[#52525B] truncate max-w-[140px]">
          {citation.document_name}
        </span>
        <span>•</span>
        <span className="bg-[#F0F0F0] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#52525B]">
          Page {citation.page_number}
        </span>
      </div>

      {/* Excerpt Body */}
      <p
        className={`text-xs text-[#334155] leading-relaxed font-normal ${
          isExpanded ? '' : 'line-clamp-3'
        }`}
      >
        "{citation.passage_text}"
      </p>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9] text-[11px]">
        {citation.passage_text.length > 120 ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-semibold text-[#1B98F2] hover:underline"
          >
            {isExpanded ? 'Show less' : 'Read full excerpt'}
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors py-0.5 px-1.5 rounded hover:bg-[#F1F5F9]"
            title="Copy verbatim clause"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#16A34A]" />
                <span className="text-[#16A34A]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onOpenDrawer && (
            <button
              onClick={onOpenDrawer}
              className="text-[#64748B] hover:text-[#1B98F2] p-0.5 transition-colors"
              title="Inspect in document drawer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
