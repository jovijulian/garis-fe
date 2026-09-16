import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { ReimbursementApproval } from '@/types/reimbursement';
import { User, Clock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface ReimbursementTimelineProps {
  approvals?: ReimbursementApproval[];
  hideHeader?: boolean;
  className?: string;
  columns?: 1 | 2;
}

export const ReimbursementTimeline: React.FC<ReimbursementTimelineProps> = ({
  approvals = [],
  hideHeader = false,
  className = '',
  columns,
}) => {
  moment.locale('id');

  if (approvals.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-xs italic">
        Belum ada data alur persetujuan.
      </div>
    );
  }

  const getApproverLabel = (type: string, order: number) => {
    if (type === 'MANAGER') return `Tingkat ${order}: Manager`;
    if (type === 'GA_ADMIN') return `Tingkat ${order}: GA Admin`;
    return `Tingkat ${order}: ${type}`;
  };

  const renderApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[11px] font-semibold shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 text-[11px] font-semibold shrink-0">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold shrink-0">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  // Determine grid columns: default to 1 col if columns is 1, or responsive grid if 2
  const gridClass =
    columns === 1
      ? 'grid grid-cols-1 gap-3'
      : 'grid grid-cols-1 md:grid-cols-2 gap-3.5';

  const content = (
    <div className={gridClass}>
      {approvals.map((app) => (
        <div
          key={app.id}
          className="p-3.5 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col justify-between space-y-3 transition-all hover:bg-gray-50"
        >
          <div>
            {/* Header Level & Badge (Wrapped cleanly on narrow screens) */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-gray-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                {getApproverLabel(app.approver_type, app.approval_order)}
              </span>
              {renderApprovalBadge(app.status)}
            </div>

            {/* Assigned Approver Info */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 mt-2.5">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate" title={app.assigned_user?.nama_user || app.action_by || ''}>
                {app.assigned_user?.nama_user || app.action_by || 'Menunggu penugasan'}
              </span>
            </div>

            {/* Approver Notes if any */}
            {app.notes && (
              <p className="mt-2 text-xs text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-200/70 whitespace-pre-wrap break-words">
                &quot;{app.notes}&quot;
              </p>
            )}
          </div>

          {/* Action Timestamp or Pending indicator */}
          {app.action_date ? (
            <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
              <Clock className="w-3 h-3 text-gray-400 shrink-0" />
              <span>Diproses: {moment(app.action_date).format('DD MMM YYYY, HH:mm')}</span>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200/60 text-[11px] text-amber-600 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Menunggu tindakan</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (hideHeader) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3.5 ${className}`}>
      <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
        <span>Alur Persetujuan (Approval)</span>
      </h3>
      {content}
    </div>
  );
};

export default ReimbursementTimeline;
