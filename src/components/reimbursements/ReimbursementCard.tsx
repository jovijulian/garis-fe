import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, MapPin, Edit, Trash2, ChevronRight, Printer, Coins, Clock } from 'lucide-react';
import Link from 'next/link';
import { ReimbursementListItem } from '@/types/reimbursement';
import ReimbursementStatusBadge from './ReimbursementStatusBadge';

interface ReimbursementCardProps {
  reimbursement: ReimbursementListItem;
  onEdit: () => void;
  onDelete: () => void;
  onPrint?: () => void;
}

export const ReimbursementCard: React.FC<ReimbursementCardProps> = ({
  reimbursement,
  onEdit,
  onDelete,
  onPrint,
}) => {
  moment.locale('id');
  const canBeEdited = reimbursement.status === 'WAITING_MANAGER';
  const isClosed = reimbursement.status === 'CLOSED';

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `Rp ${Number(num || 0).toLocaleString('id-ID')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg border border-gray-100">
      <Link
        href={`/reimbursements/my-reimbursements/${reimbursement.id}`}
        className="p-5 flex-grow block group"
      >
        <div className="flex items-center justify-between gap-2">
          <ReimbursementStatusBadge status={reimbursement.status} size="sm" />
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            {formatCurrency(reimbursement.total_claim)}
          </span>
        </div>

        <h3 className="text-base font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-2 mt-3">
          {reimbursement.document_number}
        </h3>

        <p className="text-xs text-gray-500 line-clamp-2 mb-4">
          {reimbursement.purpose || '-'}
        </p>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate font-medium">{reimbursement.destination || '-'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>
              {moment(reimbursement.start_date).format('DD MMM YYYY')} - {moment(reimbursement.end_date).format('DD MMM YYYY')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>
              {reimbursement.duration} {reimbursement.duration_type || 'Hari'}
            </span>
          </div>
        </div>
      </Link>

      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
        <Link
          href={`/reimbursements/my-reimbursements/${reimbursement.id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          Lihat Detail
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          {isClosed && onPrint && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onPrint();
              }}
              title="Cetak Form Reimbursement (PDF)"
              className="p-1.5 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            title={canBeEdited ? "Hapus Pengajuan" : "Hanya dapat dihapus saat status WAITING_MANAGER"}
            disabled={!canBeEdited}
            className="p-1.5 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            disabled={!canBeEdited}
            title={canBeEdited ? "Ubah Pengajuan" : "Hanya dapat diubah saat status WAITING_MANAGER"}
            className="p-1.5 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementCard;
