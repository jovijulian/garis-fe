"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/id";
import { endpointUrl, httpGet } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal";
import ReimbursementStatusBadge from "@/components/reimbursements/ReimbursementStatusBadge";
import ReimbursementTimeline from "@/components/reimbursements/ReimbursementTimeline";
import ReimbursementAdminApprovalModal from "@/components/reimbursements/ReimbursementAdminApprovalModal";
import { ReimbursementDetail } from "@/types/reimbursement";

import {
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarDay,
  FaCoins,
  FaClipboardList,
  FaStickyNote,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaFilePdf,
  FaUsers,
  FaPaperclip,
} from "react-icons/fa";
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || "https://api-garis.cisangkan.co.id/";
  return `${baseUrl}${fileUrl.replace(/^\//, "")}`;
};

export default function AdminReimbursementDetailPage() {
  moment.locale("id");
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [data, setData] = useState<ReimbursementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const getDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await httpGet(endpointUrl(`/reimbursements/${id}`), true);
      const resData = response?.data?.data;
      if (resData) {
        setData(resData);
      } else {
        setError("Data pengajuan reimbursement tidak ditemukan.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal memuat detail pengajuan reimbursement.");
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

  const handlePrint = async () => {
    if (!data) return;
    setIsPrinting(true);
    try {
      const response = await httpGet(endpointUrl(`/reimbursements/${data.id}/print`), true);
      const htmlContent = response.data;

      if (!htmlContent) {
        toast.error("Gagal mendapatkan dokumen untuk dicetak.");
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
    } catch (err) {
      console.error("Gagal mencetak formulir reimbursement:", err);
      toast.error("Terjadi kesalahan saat menyiapkan formulir cetak.");
    } finally {
      setIsPrinting(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return `Rp ${Number(num || 0).toLocaleString("id-ID")}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-4 text-gray-700">Memuat detail pengajuan reimbursement...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center mt-10 p-6 bg-white border rounded-lg">
        <p className="text-red-600 font-medium">{error || "Data reimbursement tidak ditemukan."}</p>
        <button
          onClick={() => router.push("/reimbursements/manage-request")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
        >
          Kembali ke List Pengajuan
        </button>
      </div>
    );
  }

  const isWaitingGA = data.status === "WAITING_GA";
  const isClosed = data.status === "CLOSED";

  return (
    <>
      <ComponentCard title="Detail Pengajuan Reimbursement">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                {data.document_number}
              </h1>
            </div>

            <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-1">
              <span>Diajukan oleh</span>
              <strong className="text-gray-700">
                {data.requester?.nama_user || data.user_id}
              </strong>

              <span className="text-gray-400">
                (Dept. {data.department?.nama_dept || "-"})
              </span>

            </p>
          </div>

          <div className="flex items-center gap-3">
            <ReimbursementStatusBadge status={data.status} />
            {isClosed && (
              <button
                onClick={handlePrint}
                title="Unduh / Cetak Formulir (PDF)"
                disabled={isPrinting}
                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >
                {isPrinting ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <FaFilePdf className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>
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
            label="Tujuan Perjalanan"
            value={data.destination}
          />
          <DetailItem
            icon={<FaCalendarDay />}
            label="Waktu Pelaksanaan"
            value={`${moment(data.start_date).format("DD MMM YYYY")} - ${moment(data.end_date).format("DD MMM YYYY")}`}
          />
          <DetailItem
            icon={<FaCoins />}
            label="Total Nilai Klaim"
            value={formatCurrency(data.total_claim)}
          />
        </div>

        {/* 2-Column Main Grid (3 : 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Detail Permintaan */}
            <Section title="Detail Pengajuan Klaim" icon={null}>
              <InfoRow label="Nomor Dokumen" value={data.document_number} />
              <InfoRow label="Keperluan" value={data.purpose} />
              <InfoRow label="Kota / Lokasi Tujuan" value={data.destination} />
              <InfoRow
                label="Tanggal"
                value={`${moment(data.start_date).format("DD MMMM YYYY")} - ${moment(data.end_date).format("DD MMMM YYYY")}`}
              />
              <InfoRow
                label="Durasi Perjalanan"
                value={`${data.duration} ${data.duration_type || "Hari"}`}
              />
              <InfoRow
                label="Jumlah Peserta Dinas"
                value={`${data.participant_count || 1} Orang`}
              />
              <InfoRow
                label="Total Klaim Diajukan"
                value={
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(data.total_claim)}
                  </span>
                }
              />
              <InfoRow
                label="Waktu Pengajuan"
                value={moment(data.created_at).format("DD MMMM YYYY, HH:mm")}
              />
            </Section>

            {/* Rincian Pengeluaran / Klaim Biaya */}
            <Section title="Rincian Pengeluaran / Item Biaya" icon={null}>
              {/* Mobile View */}
              <div className="block md:hidden space-y-3">
                {data.details && data.details.length > 0 ? (
                  data.details.map((detail, index) => (
                    <div
                      key={detail.id || index}
                      className="bg-gray-50 border rounded-lg p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="font-semibold text-gray-800">
                          {index + 1}. {detail.item?.item_name || `Item #${detail.item_id}`}
                        </span>
                        {detail.has_receipt ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ada Kwitansi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            <XCircle className="w-3 h-3 text-gray-400" /> Tanpa Kwitansi
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Nominal Klaim:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(detail.claim_amount)}
                        </span>
                      </div>
                      {detail.notes && (
                        <p className="text-gray-600 bg-white p-2 rounded border text-[11px]">
                          {detail.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-sm">Tidak ada rincian item klaim.</p>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] font-semibold border-b">
                    <tr>
                      <th className="px-3.5 py-2.5 w-10 text-center">No</th>
                      <th className="px-3.5 py-2.5">Kategori Biaya</th>
                      <th className="px-3.5 py-2.5 text-center w-32">Bukti Kwitansi</th>
                      <th className="px-3.5 py-2.5 text-right">Nominal Klaim</th>
                      <th className="px-3.5 py-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.details && data.details.length > 0 ? (
                      data.details.map((detail, index) => (
                        <tr key={detail.id || index} className="hover:bg-gray-50/50">
                          <td className="px-3.5 py-2.5 text-center text-gray-500">{index + 1}</td>
                          <td className="px-3.5 py-2.5 font-semibold text-gray-800">
                            {detail.item?.item_name || `Item #${detail.item_id}`}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            {detail.has_receipt ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                <XCircle className="w-3.5 h-3.5 text-gray-400" /> Tidak
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-gray-900">
                            {formatCurrency(detail.claim_amount)}
                          </td>
                          <td className="px-3.5 py-2.5 text-gray-600 text-xs">
                            {detail.notes || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500 italic">
                          Tidak ada rincian item klaim
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                    <tr>
                      <td colSpan={3} className="px-3.5 py-2.5 text-right text-gray-700">
                        Total Nilai Klaim:
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-emerald-600 text-sm sm:text-base">
                        {formatCurrency(data.total_claim)}
                      </td>
                      <td className="px-3.5 py-2.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Section>

            {/* Lampiran Bukti Kwitansi / Berkas */}
            {data.attachments && data.attachments.length > 0 && (
              <Section
                title={`Bukti Kwitansi / Lampiran Berkas (${data.attachments.length})`}
                icon={<FaPaperclip />}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {data.attachments.map((att) => {
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
                                title: att.file_name || "Bukti Kwitansi",
                              })
                            }
                          >
                            <img
                              src={fullUrl}
                              alt={att.file_name || "Kwitansi"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ) : (
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square flex flex-col items-center justify-center p-3 bg-red-50/40 hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
                          >
                            <FaFilePdf className="w-8 h-8 mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              PDF
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
            {/* Sticky Keperluan Box */}
            <div className="bg-white border rounded-lg p-5 sticky top-24 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                  Alur Persetujuan (Approval)
                </h4>
                <ReimbursementTimeline approvals={data.approvals} hideHeader columns={1} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions for WAITING_GA */}
        {isWaitingGA && (
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition-colors flex items-center gap-2"
              onClick={() => handleOpenApprovalModal("REJECTED")}
            >
              <FaTimesCircle /> Tolak Pengajuan
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-2"
              onClick={() => handleOpenApprovalModal("APPROVED")}
            >
              <FaCheckCircle /> Setujui Pengajuan
            </button>
          </div>
        )}
      </ComponentCard>

      {/* Approval / Rejection Modal */}
      <ReimbursementAdminApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        requestId={data.id}
        documentNumber={data.document_number}
        actionType={actionType}
        onSuccess={getDetail}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        imageTitle={previewImage?.title || "Bukti Lampiran"}
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

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined | React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 py-2.5 last:border-b-0 gap-1">
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="font-semibold text-gray-800 text-left sm:text-right text-sm">
      {value || "-"}
    </span>
  </div>
);
