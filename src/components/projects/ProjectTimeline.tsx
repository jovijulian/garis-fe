import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import {
  ProjectApproval,
  ProjectProgressTimelineItem,
  ProjectAttachment
} from '@/types/project';
import ProjectStatusBadge from './ProjectStatusBadge';
import {
  FileText,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';

interface ProjectTimelineProps {
  approvals?: ProjectApproval[];
  progressTimeline?: ProjectProgressTimelineItem[];
  onPreviewImage?: (url: string, name?: string) => void;
}

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  approvals = [],
  progressTimeline = [],
  onPreviewImage
}) => {
  moment.locale('id');

  return (
    <div className="space-y-8">
      {approvals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            Alur Persetujuan (Approval)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {approvals.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Tingkat {app.approval_order}
                    </span>
                    <ProjectStatusBadge status={app.status} type="approval" size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>
                      {app.assigned_user?.nama_user || app.action_by || 'Belum ditugaskan'}
                    </span>
                  </div>

                  {app.notes && (
                    <p className="mt-2 text-xs text-gray-600 italic bg-white p-2 rounded border border-gray-100">
                      &quot;{app.notes}&quot;
                    </p>
                  )}
                </div>

                {app.action_date && (
                  <div className="mt-3 pt-2 border-t border-gray-200/60 text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{moment(app.action_date).format('DD MMM YYYY, HH:mm')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
          Timeline Progress & Perkembangan
        </h3>

        {progressTimeline.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6 italic">
            Belum ada catatan progress pada pengajuan ini.
          </p>
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 space-y-6">
            {progressTimeline.map((item) => (
              <div key={item.id} className="relative pl-6">
                {/* Bullet */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50 border border-white" />

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800 text-sm md:text-base">
                        {item.title}
                      </h4>
                      <ProjectStatusBadge status={item.progress_type} type="progress" size="sm" />
                    </div>

                    {item.created_at && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {moment(item.created_at).format('DD MMM YYYY, HH:mm')}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-line mb-3">
                    {item.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>User ID: {item.user_id}</span>
                  </div>

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" />
                        Lampiran ({item.attachments.length}):
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {item.attachments.map((att) => {
                          const fullUrl = getFullImageUrl(att.file_url);
                          const isImage = att.file_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name || att.file_url);

                          return (
                            <div
                              key={att.id}
                              className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-blue-400 transition-all cursor-pointer"
                              onClick={() => {
                                if (onPreviewImage) {
                                  onPreviewImage(fullUrl, att.file_name);
                                } else {
                                  window.open(fullUrl, '_blank');
                                }
                              }}
                            >
                              {isImage ? (
                                <div className="h-24 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                  <img
                                    src={fullUrl}
                                    alt={att.file_name}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              ) : (
                                <div className="h-24 w-full flex flex-col items-center justify-center bg-gray-50 p-2 text-center">
                                  <FileText className="w-8 h-8 text-blue-500 mb-1" />
                                  <span className="text-[10px] text-gray-600 truncate w-full">
                                    {att.file_name}
                                  </span>
                                </div>
                              )}
                              <div className="p-1.5 text-[10px] text-gray-700 truncate border-t bg-white">
                                {att.file_name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTimeline;
