import React from 'react';
import { Sparkles } from 'lucide-react';

interface PromptSuggestionChipsProps {
  onSelectPrompt: (question: string) => void;
  isLoading?: boolean;
}

const SUGGESTED_PROMPTS = [
  {
    category: 'Limits & Cover',
    question: 'What is the primary sum insured and room rent capping under this policy?',
  },
  {
    category: 'Claims Process',
    question: 'What is the step-by-step procedure for emergency cashless hospital admission?',
  },
  {
    category: 'Co-pay & Deductions',
    question: 'Does this policy enforce any mandatory co-payment or proportionate deduction?',
  },
  {
    category: 'Waiting Periods',
    question: 'What are the waiting periods for pre-existing diseases (PED) and specific surgeries?',
  },
  {
    category: 'Exclusions',
    question: 'What medical treatments and non-medical consumables are explicitly excluded?',
  },
  {
    category: 'Restoration',
    question: 'How does the sum insured reload or restoration benefit work if exhausted?',
  },
];

export const PromptSuggestionChips: React.FC<PromptSuggestionChipsProps> = ({
  onSelectPrompt,
  isLoading = false,
}) => {
  return (
    <div className="space-y-2.5 my-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-[#1B98F2]" />
        <span>SUGGESTED POLICY INQUIRIES</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {SUGGESTED_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.question)}
            disabled={isLoading}
            className="p-3 text-left rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1B98F2]/40 transition-all shadow-2xs hover:shadow-xs group disabled:opacity-50"
          >
            <div className="text-[10px] font-bold text-[#1B98F2] mb-1">
              {item.category}
            </div>
            <p className="text-xs text-[#334155] font-medium leading-snug group-hover:text-[#0F172A]">
              "{item.question}"
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
