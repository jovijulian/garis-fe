"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectVerificationModal from "@/components/projects/ProjectVerificationModal";
import { ProjectRequestDetail } from "@/types/project";

import {
  Building2, User, Calendar, FileText, CheckCircle2, AlertTriangle,
  Edit, Trash2, ArrowLeft, Paperclip, Wrench, ShieldCheck, Clock
} from "lucide-react";

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export default function ProjectRequestDetailPage() {
  const [data, setData] = useState<ProjectRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  moment.locale('id');

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isVerificationModalOpen, setVerificationModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const getDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await httpGet(endpointUrl(`/project-requests/${id}`), true);
      setData(response?.data?.data || null);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal mengambil detail pengajuan proyek.");
      toast.error("Gagal mengambil detail pengajuan proyek.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    getDetail();
  }, [getDetail]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-sm font-medium text-gray-600">Memuat detail pengajuan proyek...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-800 mb-1">Pengajuan Tidak Ditemukan</h3>
        <p className="text-sm text-red-600 mb-4">{error || "Data pengajuan proyek tidak ditemukan."}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>
    );
  }

  const canBeEdited = data.status === 'WAITING_APPROVAL';
  const isWaitingVerification = data.status === 'WAITING_VERIFICATION';

  return (
    <>
      <div className="space-y-6">
        <ComponentCard title="Informasi Permasalahan & Perbaikan">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    {data.document_number}
                  </h1>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dibuat pada {moment(data.request_date).format('DD MMMM YYYY, HH:mm')}
                  {data.completion_date && ` • Selesai pada ${moment(data.completion_date).format('DD MMMM YYYY, HH:mm')}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <ProjectStatusBadge status={data.status} />

              {/* {isWaitingVerification && (
                <button
                  onClick={() => setVerificationModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi Request</span>
                </button>
              )} */}

              <button
                onClick={() => {
                  if (canBeEdited) {
                    router.push(`/projects/edit/${data.id}`);
                  } else {
                    toast.warning('Pengajuan hanya dapat diubah saat status WAITING_APPROVAL.');
                  }
                }}
                disabled={!canBeEdited}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Ubah</span>
              </button>

              <button
                onClick={() => {
                  if (canBeEdited) {
                    setDeleteModalOpen(true)
                  } else {
                    toast.warning('Pengajuan hanya dapat dihapus saat status WAITING_APPROVAL.');
                  }
                }}
                disabled={!canBeEdited}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          {isWaitingVerification && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-purple-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-purple-900">
                    Pengajuan ini Menunggu Verifikasi Anda
                  </p>
                  <p className="text-xs text-purple-700">
                    Silakan lakukan verifikasi hasil pekerjaan untuk menutup request atau meminta revisi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerificationModalOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shrink-0"
              >
                Lakukan Verifikasi Sekarang
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Pemohon </span>
                <span className="text-sm font-bold text-gray-800">
                  {data.requester?.nama_user || data.user_id}
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

      <ProjectVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        requestId={data.id}
        onSuccess={getDetail}
      />

      <DeactiveModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        url={`project-requests/${data.id}`}
        selectedData={data}
        itemName={data.document_number || data.problem_description || ""}
        onSuccess={() => router.push('/projects/my-requests')}
        message="Pengajuan proyek berhasil dihapus!"
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        imageTitle={previewImage?.title || 'Preview File'}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}