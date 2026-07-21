import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, ShieldAlert, ChevronRight, User, FileText, Loader2 } from 'lucide-react';
import { endpointUrl, httpGet } from '@/../helpers';
import { ApprovalNotificationItem } from '@/types/approval';
import ApprovalDetailModal from './ApprovalDetailModal';

export const ApprovalNotificationSection: React.FC = () => {
  const [notifications, setNotifications] = useState<ApprovalNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await httpGet(endpointUrl('/approvals/notifications'), true);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching approval notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div className="max-w-5xl mx-auto mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-4 sm:p-5 border border-blue-200/80 dark:border-gray-700 shadow-md transition-all">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-blue-200/60 dark:border-gray-700">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5 sm:mt-0">
              <BellRing className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h2 className="font-bold text-gray-800 dark:text-white text-base md:text-lg leading-tight">
                Persetujuan Menunggu Tindakan Anda
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Terdapat <strong>{notifications.length}</strong> pengajuan yang memerlukan verifikasi / persetujuan Anda
              </p>
            </div>
          </div>

          <span className="self-start sm:self-center bg-blue-600 text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {notifications.length} Pending
          </span>
        </div>

        {/* Notifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {notifications.map((item) => (
            <div
              key={item.id_approval}
              className="bg-white dark:bg-gray-900 rounded-xl p-3.5 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 max-w-full truncate">
                    {item.module_name} • {item.approver_type}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-2 mb-1.5 leading-snug">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">Pemohon: <strong>{item.requester_name}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  onClick={() => setSelectedApprovalId(item.id_approval)}
                  className="w-full sm:w-auto justify-center px-4 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Tinjau & Proses</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ApprovalDetailModal
        isOpen={!!selectedApprovalId}
        approvalId={selectedApprovalId}
        onClose={() => setSelectedApprovalId(null)}
        onSuccess={fetchNotifications}
      />
    </>
  );
};

export default ApprovalNotificationSection;
