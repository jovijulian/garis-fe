import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react';
import { ReimbursementStatus } from '@/types/reimbursement';

interface StatusBadgeProps {
  status: ReimbursementStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ReimbursementStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs'
      : 'px-3 py-1 text-xs md:text-sm font-medium';

  switch (status) {
    case 'WAITING_MANAGER':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses} ${className}`}
        >
          <Hourglass className="w-3.5 h-3.5 text-amber-600" />
          Menunggu Manager
        </span>
      );

    case 'WAITING_GA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses} ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          Menunggu GA
        </span>
      );

    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Closed
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses} ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Ditolak
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 ${sizeClasses} ${className}`}
        >
          {status || '-'}
        </span>
      );
  }
};

export default ReimbursementStatusBadge;
