"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/id";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import ProjectAdminApprovalModal from "@/components/projects/ProjectAdminApprovalModal";
import ProjectAddProgressModal from "@/components/projects/ProjectAddProgressModal";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal";

import { ProjectRequestDetail } from "@/types/project";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarDay,
  FaClipboardList,
  FaStickyNote,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaFilePdf,
  FaPaperclip,
  FaTools,
  FaUser,
} from "react-icons/fa";
import {
  ArrowLeft,
  FileText,
  Loader2,
  PlusCircle,
  Send,
  Clock,
} from "lucide-react";

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || "https://api-garis.cisangkan.co.id/";
  return `${baseUrl}${fileUrl.replace(/^\//, "")}`;
};

export default function AdminProjectRequestDetailPage() {
  moment.locale("id");
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [data, setData] = useState<ProjectRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const [isExport, setIsExport] = useState(false);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
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

  const handleOpenApprovalModal = (type: "APPROVED" | "REJECTED") => {
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
        toast.error("Gagal mendapatkan data untuk dicetak.");
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
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
      console.error("Gagal mencetak nota proyek:", error);
      toast.error("Terjadi kesalahan saat menyiapkan nota.");
    } finally {
      setIsExport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-4 text-gray-700">Memuat detail pengajuan proyek...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center mt-10 p-6 bg-white border rounded-lg">
        <p className="text-red-600 font-medium">Data pengajuan proyek tidak ditemukan.</p>
        <button
          onClick={() => router.push("/projects/manage-request")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const isApprovedOrInProgress = ["IN_PROGRESS", "WAITING_VERIFICATION"].includes(data.status);
  const isWaitingGA = data.status === "WAITING_GA";

  return (
    <>
      <ComponentCard title="Detail Request Proyek (Admin)">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                {data.document_number}
              </h1>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                Perbaikan / Perawatan Proyek
              </span>
            </div>

            <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-1">
              <span>Diajukan oleh</span>
              <strong className="text-gray-700">
                {data.requester?.nama_user || data.user_id}
              </strong>

              <span className="text-gray-400">
                (Dept. {data.department?.nama_dept || "-"})
              </span>

              <span className="mx-1 text-gray-300">•</span>

              <span>ID</span>
              <strong className="text-gray-700">#{data.id}</strong>

              <span className="mx-1 text-gray-300">•</span>

              <span>Tanggal:</span>
              <strong className="text-gray-700">
                {moment(data.request_date).format("DD MMM YYYY")}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProjectStatusBadge status={data.status} />

            {data.status !== "WAITING_GA" && (
              <button
                onClick={handleExport}
                title="Unduh / Cetak Permintaan (PDF)"
                disabled={isExport}
                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >
                {isExport ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <FaFilePdf className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Cetak Permintaan</span>
              </button>
            )}
            {isWaitingGA && (
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition-colors flex items-center gap-2"
                  onClick={() => handleOpenApprovalModal("REJECTED")}
                >
                  <FaTimesCircle /> Tolak Request
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-2"
                  onClick={() => handleOpenApprovalModal("APPROVED")}
                >
                  <FaCheckCircle /> Setujui Request
                </button>
              </div>
            )}

          </div>
        </div>

        {/* 4 DetailItem Cards in Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DetailItem
            icon={<FaBuilding />}
            label="Departemen"
            value={data.department?.nama_dept}
          />
          <DetailItem
            icon={<FaMapMarkerAlt />}
            label="Cabang"
            value={data.cabang?.nama_cab || "Pusat"}
          />
          <DetailItem
            icon={<FaCalendarDay />}
            label="Waktu Pengajuan"
            value={moment(data.request_date).format("DD MMM YYYY, HH:mm")}
          />
          <DetailItem
            icon={<FaUser />}
            label="Pemohon"
            value={data.requester?.nama_user || data.user_id}
          />
        </div>

        {/* 2-Column Main Grid (3 : 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Uraian Masalah & Perbaikan */}
            <Section title="Informasi Masalah & Tindakan" icon={null}>
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 font-semibold text-xs block mb-1">
                    Uraian Masalah / Kendala:
                  </span>
                  <div className="bg-gray-50 p-3.5 rounded-lg border text-gray-800 whitespace-pre-line leading-relaxed">
                    {data.problem_description || "-"}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold text-xs block mb-1">
                    Penyebab Masalah (Root Cause):
                  </span>
                  <div className="bg-gray-50 p-3.5 rounded-lg border text-gray-700 whitespace-pre-line leading-relaxed">
                    {data.root_cause || "-"}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold text-xs block mb-1">
                    Tindakan Perbaikan / Solusi (Corrective Action):
                  </span>
                  <div className="bg-gray-50 p-3.5 rounded-lg border text-gray-700 whitespace-pre-line leading-relaxed">
                    {data.corrective_action || "-"}
                  </div>
                </div>
              </div>
            </Section>

            {/* Riwayat Progress Pengerjaan */}
            <Section title="Riwayat Progress Pengerjaan" icon={null}>
              {data.progress_timeline && data.progress_timeline.length > 0 ? (
                <div className="space-y-4">
                  {data.progress_timeline.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-lg border bg-gray-50/50 space-y-2 text-xs sm:text-sm"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="font-semibold text-gray-800">
                          Progress #{idx + 1}
                        </span>
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {moment(item.created_at || item.progress_date).format("DD MMM YYYY, HH:mm")}
                        </span>
                      </div>

                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {item.description || item.notes || "-"}
                      </p>

                      {item.photo_url && (
                        <div className="pt-2">
                          <img
                            src={getFullImageUrl(item.photo_url)}
                            alt="Foto Progress"
                            onClick={() =>
                              setPreviewImage({
                                url: getFullImageUrl(item.photo_url),
                                title: `Foto Progress #${idx + 1}`,
                              })
                            }
                            className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">Belum ada catatan progress pengerjaan.</p>
              )}
            </Section>

            {/* Lampiran Foto Awal */}
            {data.attachments && data.attachments.length > 0 && (
              <Section
                title={`Foto / Lampiran Awal Pengajuan (${data.attachments.length})`}
                icon={null}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {data.attachments.map((att: any) => {
                    const fullUrl = getFullImageUrl(att.file_url);
                    const isImage =
                      att.file_type?.startsWith("image/") ||
                      /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name || att.file_url);

                    return (
                      <div
                        key={att.id}
                        className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        {isImage ? (
                          <div
                            className="aspect-square bg-gray-100 relative cursor-pointer overflow-hidden flex items-center justify-center"
                            onClick={() =>
                              setPreviewImage({
                                url: fullUrl,
                                title: att.file_name || "Lampiran Pengajuan",
                              })
                            }
                          >
                            <img
                              src={fullUrl}
                              alt={att.file_name || "Lampiran"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ) : (
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square flex flex-col items-center justify-center p-3 bg-blue-50/40 hover:bg-blue-50 text-blue-600 cursor-pointer transition-colors"
                          >
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              Berkas
                            </span>
                          </a>
                        )}

                        <div className="p-2 bg-white border-t border-gray-100">
                          <p
                            className="text-xs font-semibold text-gray-700 truncate"
                            title={att.file_name}
                          >
                            {att.file_name}
                          </p>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline block mt-0.5 font-medium"
                          >
                            Lihat Berkas
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sticky Actions & Approval Card */}
            <div className="bg-white border rounded-lg p-5 sticky top-24 space-y-6">
              {/* Progress Management Actions */}
              {isApprovedOrInProgress && data.status !== "CLOSED" && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
             Kelola Pengerjaan
                  </h4>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddProgressModalOpen(true)}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Tambah Progress Perbaikan</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestVerification}
                      disabled={isRequestingVerification}
                      className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Minta Verifikasi ke User</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alur Persetujuan / Approvals */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                  Alur Persetujuan (Approval)
                </h4>

                {data.approvals && data.approvals.length > 0 ? (
                  <div className="space-y-3">
                    {data.approvals.map((app: any) => (
                      <div
                        key={app.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">
                            {app.approver_type || `Tingkat ${app.approval_order}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${app.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                              }`}
                          >
                            {app.status || "PENDING"}
                          </span>
                        </div>

                        <p className="text-gray-600">
                          Oleh: {app.assigned_user?.nama_user || app.action_by || "-"}
                        </p>

                        {app.notes && (
                          <p className="text-gray-500 italic bg-white p-2 rounded border text-[11px]">
                            &quot;{app.notes}&quot;
                          </p>
                        )}

                        {app.action_date && (
                          <p className="text-[10px] text-gray-400">
                            Diproses: {moment(app.action_date).format("DD MMM YYYY, HH:mm")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">Belum ada data persetujuan.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar for WAITING_GA */}

      </ComponentCard>

      {/* Approval Modal */}
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
        imageTitle={previewImage?.title || "Preview Attachment"}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-white border rounded-lg p-5">
    <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
      <span>{title}</span>
    </h4>
    {children}
  </div>
);

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full">
    <div className="text-blue-500 text-xl mt-1">{icon}</div>
    <div>
      <span className="text-gray-500 text-sm block">{label}</span>
      <span className="font-semibold text-base text-gray-800">{value || "-"}</span>
    </div>
  </div>
);