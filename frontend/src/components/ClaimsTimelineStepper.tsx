import React, { useState } from 'react';
import { Clock, CheckCircle, FileCheck, ArrowRight } from 'lucide-react';

export interface ClaimsStep {
  number: number;
  id: string;
  title: string;
  subtitle: string;
  slaTime: string;
  slaBadgeColor: string;
  documents: string[];
  irdaiRule: string;
  summary: string;
}

export const claimsSteps: ClaimsStep[] = [
  {
    number: 1,
    id: 'intimation',
    title: 'Hospital Intimation',
    subtitle: 'Emergency within 24h / Planned 48h prior',
    slaTime: '< 24 Hours',
    slaBadgeColor: 'bg-amber-100 text-amber-800',
    documents: ['Policy Number or e-Health Card', 'Patient Govt Photo ID (Aadhaar/PAN)', 'Attending Doctor Prescription'],
    irdaiRule: 'IRDAI Master Circular 2020 Clause 12.1',
    summary: 'Notify the insurer or TPA immediately upon hospital arrival. For planned surgeries, submit 48 hours before admission.',
  },
  {
    number: 2,
    id: 'preauth',
    title: 'Cashless Desk Submission',
    subtitle: 'Hospital insurance counter pre-auth form',
    slaTime: 'Immediate Submission',
    slaBadgeColor: 'bg-sky-100 text-sky-800',
    documents: ['Pre-Authorization Request Form (Filled by Hospital)', 'Estimated Cost of Treatment Breakdown', 'Diagnostic & Lab Reports'],
    irdaiRule: 'IRDAI Standardized Health Form Schedule A',
    summary: 'Hospital cashless coordinator submits medical pre-auth request directly to insurer TPA portal.',
  },
  {
    number: 3,
    id: 'tpa_approval',
    title: 'TPA Initial Guarantee',
    subtitle: 'Mandatory 60-minute IRDAI turnaround',
    slaTime: '< 60 Minutes SLA',
    slaBadgeColor: 'bg-emerald-100 text-emerald-800',
    documents: ['Initial Guarantee Letter from TPA', 'Approved Provisional Sum Insured', 'Treating Doctor Notes'],
    irdaiRule: 'IRDAI Mandate 2024: Cashless Authorization within 1 Hour',
    summary: 'Insurer TPA evaluates admissibility and transmits Initial Guarantee Letter to the hospital cashless desk.',
  },
  {
    number: 4,
    id: 'settlement',
    title: 'Final Discharge & Settlement',
    subtitle: 'Zero unexpected co-pay at hospital desk',
    slaTime: '< 3 Hours SLA',
    slaBadgeColor: 'bg-purple-100 text-purple-800',
    documents: ['Final Itemized Hospital Bill', 'Discharge Summary', 'Payment Receipt for Non-Medical Consumables'],
    irdaiRule: 'IRDAI Final Settlement Directive Rule 9',
    summary: 'Insurer settles hospital bill directly. Patient pays only non-medical consumables (e.g. gloves, visitor food).',
  },
];

interface ClaimsTimelineStepperProps {
  onStepSelect?: (step: ClaimsStep) => void;
}

export const ClaimsTimelineStepper: React.FC<ClaimsTimelineStepperProps> = ({ onStepSelect }) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const activeStep = claimsSteps[activeStepIndex];

  const handleSelect = (idx: number) => {
    setActiveStepIndex(idx);
    if (onStepSelect) {
      onStepSelect(claimsSteps[idx]);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBEBEB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#17510B] bg-[#C0F2B5] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Cashless Protocol
            </span>
            <span className="text-xs text-[#71717A]">•</span>
            <span className="text-xs text-[#71717A] font-medium">Standard IRDAI 4-Stage Pathway</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#000000] tracking-tight">
            Interactive Claims Process Pathway
          </h3>
        </div>
        <div className="text-xs text-[#71717A] flex items-center gap-1.5 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-[#1B98F2]" />
          <span>Click any stage to inspect documentation & turnaround SLA</span>
        </div>
      </div>

      {/* Horizontal Stepper Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {claimsSteps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isDone = idx < activeStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => handleSelect(idx)}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'border-[#000000] bg-[#FAFAFA] shadow-[0_4px_16px_rgba(0,0,0,0.06)] scale-[1.02]'
                  : 'border-[#EBEBEB] bg-white hover:border-[#D4D4D8] hover:bg-[#FBFBFB]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-[#000000] text-white'
                        : isDone
                        ? 'bg-[#C0F2B5] text-[#17510B]'
                        : 'bg-[#F4F4F5] text-[#71717A]'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : step.number}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.slaBadgeColor}`}>
                    {step.slaTime}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#000000] tracking-tight line-clamp-1">
                  {step.title}
                </div>
                <div className="text-[11px] text-[#71717A] line-clamp-1 leading-snug">
                  {step.subtitle}
                </div>
              </div>

              {isActive && (
                <div className="mt-3 pt-2 border-t border-[#EBEBEB] flex items-center justify-between text-[10px] font-bold text-[#1B98F2]">
                  <span>Active Inspection</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Breakdown */}
      <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs text-[#71717A] font-semibold uppercase tracking-wider">
              Stage {activeStep.number} of 4 Detailed Specs
            </div>
            <h4 className="text-base font-bold text-[#000000]">{activeStep.title}</h4>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#1B98F2]" />
            <span>Turnaround Time: {activeStep.slaTime}</span>
          </div>
        </div>

        <p className="text-xs text-[#334155] leading-relaxed">
          {activeStep.summary}
        </p>

        {/* Required Documents Pills */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#158142]" />
            <span>Mandatory Documents Required:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {activeStep.documents.map((doc, dIdx) => (
              <div
                key={dIdx}
                className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#1E293B] font-medium flex items-center gap-2 shadow-2xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#1B98F2] shrink-0" />
                <span className="line-clamp-2">{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Protection Note */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2">
          <span className="font-mono">{activeStep.irdaiRule}</span>
          <span className="text-[#158142] font-semibold">100% Cashless Network Protection</span>
        </div>
      </div>
    </div>
  );
};
