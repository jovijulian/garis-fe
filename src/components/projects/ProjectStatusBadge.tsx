import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Hourglass,
  UserCheck
} from 'lucide-react';
import {
  ProjectRequestStatus,
  ProjectProgressType,
  ProjectApprovalStatus
} from '@/types/project';

interface StatusBadgeProps {
  status: ProjectRequestStatus | ProjectProgressType | ProjectApprovalStatus | string;
  type?: 'request' | 'progress' | 'approval';
  size?: 'sm' | 'md';
}

export const ProjectStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'request',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs md:text-sm font-medium';

  if (type === 'request' || (!type && isRequestStatus(status))) {
    switch (status as ProjectRequestStatus) {
      case 'WAITING_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}>
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            Waiting Approval
          </span>
        );
      case 'WAITING_GA':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Waiting GA
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 ${sizeClasses}`}>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            In Progress
          </span>
        );
      case 'WAITING_VERIFICATION':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 ${sizeClasses}`}>
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            Waiting Verification
          </span>
        );
      case 'REVISION':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 ${sizeClasses}`}>
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
            Revision
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Closed
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 ${sizeClasses}`}>
            {status}
          </span>
        );
    }
  }

  if (type === 'progress') {
    switch (status as ProjectProgressType) {
      case 'UPDATE_GA':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            Update GA
          </span>
        );
      case 'REVISION_USER':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            Revisi User
          </span>
        );
      case 'CLOSE_COMMENT_USER':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            Komentar Selesai
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-gray-50 text-gray-700 border border-gray-200 ${sizeClasses}`}>
            {status}
          </span>
        );
    }
  }

  if (type === 'approval') {
    switch (status as ProjectApprovalStatus) {
      case 'APPROVED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 ${sizeClasses}`}>
      {status}
    </span>
  );
};

function isRequestStatus(status: string): boolean {
  return [
    'WAITING_APPROVAL',
    'WAITING_GA',
    'IN_PROGRESS',
    'WAITING_VERIFICATION',
    'REVISION',
    'CLOSED',
    'REJECTED'
  ].includes(status);
}

export default ProjectStatusBadge;
