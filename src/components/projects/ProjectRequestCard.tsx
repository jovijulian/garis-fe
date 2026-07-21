import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Building2, User, FileText, Edit, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ProjectRequestListItem } from '@/types/project';
import ProjectStatusBadge from './ProjectStatusBadge';

interface ProjectRequestCardProps {
  request: ProjectRequestListItem;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectRequestCard: React.FC<ProjectRequestCardProps> = ({
  request,
  onEdit,
  onDelete,
}) => {
  moment.locale('id');
  const canBeEdited = request.status === 'WAITING_APPROVAL';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
      <Link
        href={`/projects/my-requests/${request.id}`}
        className="p-5 flex-grow block group"
      >  <ProjectStatusBadge status={request.status} size="sm" />
        <h3 className="text-base font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-3 mt-3">
          {request.document_number}
        </h3>

        <div className="space-y-3 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{moment(request.request_date).format('dddd, DD MMMM YYYY')}</span>
          </div>

        </div>


      </Link>

      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
        <Link
          href={`/projects/my-requests/${request.id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          Lihat Detail
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            title="Hapus / Batalkan Pengajuan"
            disabled={!canBeEdited}
            className="p-1.5 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onEdit}
            disabled={!canBeEdited}
            title={canBeEdited ? "Ubah Pengajuan" : "Hanya dapat diubah saat status WAITING_APPROVAL"}
            className="p-1.5 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectRequestCard;
