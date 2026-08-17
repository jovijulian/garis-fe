"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectAdminApprovalModal from "@/components/projects/ProjectAdminApprovalModal";
import ProjectAddProgressModal from "@/components/projects/ProjectAddProgressModal";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal";

import { ProjectRequestDetail } from "@/types/project";
import {
  ArrowLeft, Building2, User, Calendar, FileText, AlertTriangle,
  Wrench, CheckCircle2, XCircle, PlusCircle, Send, ShieldCheck, Paperclip, Loader2
} from "lucide-react";
import { FaFilePdf } from "react-icons/fa";

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export default function AdminProjectRequestDetailPage() {
  const [data, setData] = useState<ProjectRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  moment.locale('id');
  const [isExport, setIsExport] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [isAddProgressModalOpen, setIsAddProgressModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const getDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await httpGet(endpointUrl(`/project-requests/${id}`), true);
      setData(response?.data?.data || null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil detail pengajuan proyek.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    getDetail();
  }, [getDetail]);

  const handleOpenApprovalModal = (type: 'APPROVED' | 'REJECTED') => {
    setActionType(type);
    setIsApprovalModalOpen(true);
  };

  const handleRequestVerification = async () => {
    if (!id) return;
    if (!window.confirm("Apakah Anda yakin ingin meminta verifikasi perbaikan kepada pengguna?")) {
      return;
    }

    setIsRequestingVerification(true);
    try {
      await httpPut(endpointUrl(`/project-requests/${id}/request-verification`), {}, true);
      toast.success("Permintaan verifikasi berhasil dikirimkan kepada user!");
      getDetail();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal mengirimkan permintaan verifikasi.");
    } finally {
      setIsRequestingVerification(false);
    }
  };

  const handleExport = async () => {
    if (!data) return;
    setIsExport(true);
    try {
      const response = await httpGet(endpointUrl(`project-requests/${data.id}/print`), true);
      const htmlContent = response.data;

      if (!htmlContent) {
        toast.error('Gagal mendapatkan data untuk dicetak.');
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      iframe.contentDocument?.open();
      iframe.contentDocument?.write(htmlContent);
      iframe.contentDocument?.close();

      iframe.onload = function () {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };

    } catch (error) {
      setIsExport(false);
      console.error('Gagal mencetak nota:', error);
      toast.error('Terjadi kesalahan saat menyiapkan nota.');
    } finally {
      setIsExport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-sm font-medium text-gray-600">Memuat detail pengajuan proyek...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-gray-700 font-bold">Data pengajuan proyek tidak ditemukan.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  const isApprovedOrInProgress = ['IN_PROGRESS', 'WAITING_VERIFICATION'].includes(data.status);

  return (
    <>
      <div className="space-y-6">

        <ComponentCard title="Informasi Permasalahan & Perbaikan">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <ProjectStatusBadge status={data.status} />
            {data.status === 'WAITING_GA' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenApprovalModal('REJECTED')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak</span>
                </button>
                <button
                  onClick={() => handleOpenApprovalModal('APPROVED')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui</span>
                </button>
              </div>
            )}

            {isApprovedOrInProgress && data.status !== 'CLOSED' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddProgressModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Progress</span>
                </button>

                <button
                  onClick={handleRequestVerification}
                  disabled={isRequestingVerification}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Minta Verifikasi ke User</span>
                </button>
              </div>
            )}
            {data.status !== 'WAITING_GA' && (
              <button
                onClick={handleExport}
                title="Unduh Surat Perintah Jalan (PDF)"
                disabled={isExport}
                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50"
              >
                {isExport ? <Loader2 className="animate-spin w-4 h-4" /> : <FaFilePdf className="w-3 h-3" />}
                <span className="hidden sm:inline">Cetak Permintaan</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Pemohon</span>
                <span className="text-sm font-bold text-gray-800">
                  {data.requester?.nama_user || data.user_id}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Departemen</span>
                <span className="text-sm font-bold text-gray-800">
                  {data.department?.nama_dept || '-'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Tanggal Pengajuan</span>
                <span className="text-sm font-bold text-gray-800">
                  {moment(data.request_date).format('DD MMMM YYYY, HH:mm')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1 flex items-center gap-1.5">
                Uraian Masalah
              </h4>
              <p className="text-sm md:text-base text-gray-800 font-medium whitespace-pre-line">
                {data.problem_description || '-'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1 flex items-center gap-1.5">
                Penyebab Masalah
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {data.root_cause || '-'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1 flex items-center gap-1.5">
                Perbaikan / Perawatan
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {data.corrective_action || '-'}
              </p>
            </div>

            {data.attachments && data.attachments.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-purple-600" />
                  Foto / Lampiran Awal Pengajuan ({data.attachments.length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {data.attachments.map((att) => {
                    const fullUrl = getFullImageUrl(att.file_url);

                    const isImage =
                      att.file_type?.startsWith("image/") ||
                      /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name || att.file_url);

                    const isPdf =
                      att.file_type === "application/pdf" ||
                      /\.pdf$/i.test(att.file_name || att.file_url);

                    const handleClick = () => {
                      if (isImage) {
                        setPreviewImage({
                          url: fullUrl,
                          title: att.file_name,
                        });
                      } else if (isPdf) {
                        window.open(fullUrl, "_blank", "noopener,noreferrer");
                      } else {
                        window.open(fullUrl, "_blank", "noopener,noreferrer");
                      }
                    };

                    return (
                      <div
                        key={att.id}
                        onClick={handleClick}
                        className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-blue-500 transition-all cursor-pointer shadow-sm"
                      >
                        {isImage ? (
                          <div className="h-28 w-full bg-gray-100 overflow-hidden flex items-center justify-center">
                            <img
                              src={fullUrl}
                              alt={att.file_name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="h-28 w-full flex flex-col items-center justify-center bg-gray-50 p-2 text-center">
                            <FileText className="w-8 h-8 text-blue-500 mb-1" />
                            <span className="text-[10px] text-gray-600 truncate w-full">
                              {att.file_name}
                            </span>
                          </div>
                        )}
                        <div className="p-1.5 text-[11px] font-medium text-gray-700 truncate border-t bg-white">
                          {att.file_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        <ProjectTimeline
          approvals={data.approvals}
          progressTimeline={data.progress_timeline}
          onPreviewImage={(url, title) => setPreviewImage({ url, title: title || 'Lampiran' })}
        />
      </div>

      <ProjectAdminApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        requestId={data.id}
        actionType={actionType}
        onSuccess={getDetail}
      />

      {/* Add Progress Modal */}
      <ProjectAddProgressModal
        isOpen={isAddProgressModalOpen}
        onClose={() => setIsAddProgressModalOpen(false)}
        requestId={data.id}
        onSuccess={getDetail}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        imageTitle={previewImage?.title || 'Preview Attachment'}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}