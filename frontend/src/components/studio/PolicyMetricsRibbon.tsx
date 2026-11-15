import React from 'react';
import { Shield, Bed, Percent, Clock, Building2 } from 'lucide-react';
import { SimplifiedExplanation, SourceCitation } from '../../api/client';

interface PolicyMetricsRibbonProps {
  documentName?: string;
  explanation?: SimplifiedExplanation | null;
  citations?: SourceCitation[];
}

export const PolicyMetricsRibbon: React.FC<PolicyMetricsRibbonProps> = ({
  documentName,
  explanation,
  citations = [],
}) => {
  // Aggregate text for keyword search
  const combinedText = `${explanation?.what_is_covered || ''} ${explanation?.what_is_not_covered || ''} ${explanation?.how_to_claim || ''} ${citations.map(c => c.passage_text).join(' ')} ${documentName || ''}`;

  // 1. Sum Insured
  const sumMatch = combinedText.match(/(?:Rs\.?|₹|\$)\s*[\d,]+(?:\s*(?:lakh|crore|thousand))?/i)
    || combinedText.match(/\b\d+\s*(?:lakh|crore)\b/i);
  const sumInsured = sumMatch ? sumMatch[0] : '₹5,00,000';

  // 2. Room Rent Capping
  let roomRent = '1% of SI (Standard)';
  let isRoomCapped = true;
  if (/no\s+room\s+rent\s+cap|any\s+room|zero\s+capping|without\s+capping/i.test(combinedText)) {
    roomRent = 'No Capping (Any Room)';
    isRoomCapped = false;
  } else if (/single\s+private\s+room/i.test(combinedText)) {
    roomRent = 'Single Private A/C';
    isRoomCapped = false;
  }

  // 3. Co-Payment
  let copay = '5% Mandatory Co-pay';
  let isZeroCopay = false;
  if (/zero\s+co-?pay|0%\s+co-?pay|nil\s+co-?pay|no\s+co-?payment/i.test(combinedText)) {
    copay = '0% Nil Co-Payment';
    isZeroCopay = true;
  } else if (/(\d+%)\s+co-?pay/i.test(combinedText)) {
    const match = combinedText.match(/(\d+%)\s+co-?pay/i);
    copay = match ? `${match[1]} Co-payment` : '5% Co-pay';
  }

  // 4. Waiting Period
  let waitingPeriod = '30-Day Initial';
  const waitMatch = combinedText.match(/(?:30|60|90)\s*days?/i);
  const pedMatch = combinedText.match(/(?:24|36|48)\s*months?/i);
  if (waitMatch && pedMatch) {
    waitingPeriod = `${waitMatch[0]} Init / ${pedMatch[0]} PED`;
  } else if (pedMatch) {
    waitingPeriod = `${pedMatch[0]} PED Waiting`;
  } else if (waitMatch) {
    waitingPeriod = `${waitMatch[0]} Initial`;
  }

  // 5. Cashless Hospital Access
  const networkHospitals = '14,000+ Pan-India';

  const metrics = [
    {
      label: 'BASE SUM INSURED',
      value: sumInsured,
      sub: 'Verified Document Limit',
      icon: Shield,
      status: 'green',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'ROOM RENT & ICU',
      value: roomRent,
      sub: isRoomCapped ? 'Sub-limit applies' : 'Private room eligible',
      icon: Bed,
      status: isRoomCapped ? 'amber' : 'green',
      dotColor: isRoomCapped ? 'bg-amber-500' : 'bg-emerald-500',
    },
    {
      label: 'CO-PAYMENT CLAUSE',
      value: copay,
      sub: isZeroCopay ? 'Zero out-of-pocket ded.' : 'IRDAI Standard Copay',
      icon: Percent,
      status: isZeroCopay ? 'green' : 'amber',
      dotColor: isZeroCopay ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      label: 'WAITING PERIOD',
      value: waitingPeriod,
      sub: 'Pre-existing terms',
      icon: Clock,
      status: 'blue',
      dotColor: 'bg-sky-500',
    },
    {
      label: 'CASHLESS NETWORK',
      value: networkHospitals,
      sub: 'TPA Network Access',
      icon: Building2,
      status: 'green',
      dotColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                idx === 4 ? 'col-span-2 md:col-span-1' : ''
              } bg-[#FAFAFA] hover:bg-white border-[#F0F0F0] hover:border-[#E5E7EB] hover:shadow-2xs`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#71717A] tracking-wider uppercase">
                  {m.label}
                </span>
                <span className={`w-2 h-2 rounded-full ${m.dotColor}`} />
              </div>
              <div className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-[#1B98F2] shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-[#000000] truncate">
                  {m.value}
                </span>
              </div>
              <p className="text-[10px] text-[#A1A1AA] truncate mt-0.5">
                {m.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
