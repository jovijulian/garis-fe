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
import ReimbursementStatusBadge from "@/components/reimbursements/ReimbursementStatusBadge";
import ReimbursementTimeline from "@/components/reimbursements/ReimbursementTimeline";
import { ReimbursementDetail } from "@/types/reimbursement";

import {
  Building2, User, Calendar, FileText, AlertTriangle,
  Edit, Trash2, ArrowLeft, Paperclip, Printer, MapPin,
  Clock, Coins, CheckCircle2, XCircle, FileCheck
} from "lucide-react";

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export default function ReimbursementDetailPage() {
  const [data, setData] = useState<ReimbursementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  moment.locale('id');

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const getDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await httpGet(endpointUrl(`/reimbursements/${id}`), true);
      setData(response?.data?.data || null);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal mengambil detail pengajuan reimbursement.");
      toast.error("Gagal mengambil detail pengajuan reimbursement.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    getDetail();
  }, [getDetail]);

  const handlePrint = async () => {
    if (!data) return;
    setIsPrinting(true);
    try {
      const response = await httpGet(endpointUrl(`/reimbursements/${data.id}/print`), true);
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
    } catch (err) {
      console.error('Gagal mencetak dokumen reimbursement:', err);
      toast.error('Terjadi kesalahan saat menyiapkan form cetak.');
    } finally {
      setIsPrinting(false);
    }
  };

  const formatCurrency = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `Rp ${Number(num || 0).toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-sm font-medium text-gray-600">Memuat detail pengajuan reimbursement...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-800 mb-1">Pengajuan Tidak Ditemukan</h3>
        <p className="text-sm text-red-600 mb-4">{error || "Data pengajuan reimbursement tidak ditemukan."}</p>
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

  const canBeEdited = data.status === 'WAITING_MANAGER';
  const isClosed = data.status === 'CLOSED';

  return (
    <>
      <div className="space-y-6">
        <ComponentCard title="Detail Pengajuan Reimbursement">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  {data.document_number}
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Dibuat pada {moment(data.created_at).format('DD MMMM YYYY, HH:mm')}
                {data.updated_at && ` • Diperbarui pada ${moment(data.updated_at).format('DD MMMM YYYY, HH:mm')}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <ReimbursementStatusBadge status={data.status} />

              {/* Tombol Cetak PDF hanya jika CLOSED */}
              {isClosed && (
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isPrinting ? "Menyiapkan..." : "Cetak PDF"}</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (canBeEdited) {
                    router.push(`/reimbursements/edit/${data.id}`);
                  } else {
                    toast.warning('Pengajuan hanya dapat diubah saat status WAITING_MANAGER.');
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
                    setDeleteModalOpen(true);
                  } else {
                    toast.warning('Pengajuan hanya dapat dihapus saat status WAITING_MANAGER.');
                  }
                }}
                disabled={!canBeEdited}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-rose-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          {/* Informasi Perjalanan & Pemohon */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Pemohon</span>
                <span className="text-sm font-bold text-gray-800">
                  {data.requester?.nama_user || data.user_id}
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Dept: {data.department?.nama_dept || '-'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Tujuan Perjalanan</span>
                <span className="text-sm font-bold text-gray-800">
                  {data.destination || '-'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Periode Tanggal</span>
                <span className="text-sm font-bold text-gray-800">
                  {moment(data.start_date).format('DD MMM YYYY')} - {moment(data.end_date).format('DD MMM YYYY')}
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Durasi: {data.duration} {data.duration_type || 'Hari'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <Coins className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Klaim</span>
                <span className="text-base font-bold text-emerald-600">
                  {formatCurrency(data.total_claim)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">
              Keperluan / Maksud Perjalanan Dinas
            </h4>
            <p className="text-sm md:text-base text-gray-800 font-medium whitespace-pre-line">
              {data.purpose || '-'}
            </p>
          </div>

          {/* Rincian Item Klaim */}
          <div className="space-y-3 mb-6">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Rincian Pengeluaran / Klaim Biaya
            </h3>

            {/* Mobile Cards View (block md:hidden) */}
            <div className="block md:hidden space-y-3">
              {data.details && data.details.length > 0 ? (
                data.details.map((detail, index) => {
                  const hasPaidAmount = Number(detail.paid_amount || 0) > 0;
                  return (
                    <div
                      key={detail.id || index}
                      className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">
                            {detail.item?.item_name || `Item #${detail.item_id}`}
                          </span>
                        </div>
                        {detail.has_receipt ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ada Kwitansi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            <XCircle className="w-3 h-3 text-gray-400" />
                            Tanpa Kwitansi
                          </span>
                        )}
                      </div>

                      <div className={`grid ${hasPaidAmount ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-xs`}>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500 block mb-0.5 text-[11px]">Nominal Klaim</span>
                          <span className="font-bold text-gray-900 text-sm">
                            {formatCurrency(detail.claim_amount)}
                          </span>
                        </div>
                        {hasPaidAmount && (
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-emerald-700 block mb-0.5 text-[11px] font-medium">Disetujui</span>
                            <span className="font-bold text-emerald-700 text-sm">
                              {formatCurrency(detail.paid_amount || 0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {detail.notes && (
                        <div className="text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                          <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Catatan</span>
                          <p>{detail.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-xs italic">
                  Tidak ada rincian item klaim
                </div>
              )}

              {/* Total Klaim Card on Mobile */}
              <div className="bg-gradient-to-r from-gray-50 to-emerald-50/40 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Total Nilai Klaim</span>
                <span className="text-base font-bold text-emerald-700">
                  {formatCurrency(data.total_claim)}
                </span>
              </div>
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100/75 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Kategori Biaya</th>
                    <th className="px-4 py-3 text-center w-32">Bukti Kwitansi</th>
                    <th className="px-4 py-3 text-right">Nominal Klaim</th>
                    {Number(data.details?.some(d => Number(d.paid_amount || 0) > 0)) ? (
                      <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                    ) : null}
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {data.details && data.details.length > 0 ? (
                    data.details.map((detail, index) => {
                      const hasPaidColumn = data.details.some(d => Number(d.paid_amount || 0) > 0);
                      return (
                        <tr key={detail.id || index} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {detail.item?.item_name || `Item #${detail.item_id}`}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {detail.has_receipt ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Ada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                                <XCircle className="w-3.5 h-3.5 text-gray-400" />
                                Tidak
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(detail.claim_amount)}
                          </td>
                          {hasPaidColumn && (
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                              {formatCurrency(detail.paid_amount || 0)}
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {detail.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500 italic">
                        Tidak ada rincian item klaim
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-gray-700">
                      Total Nilai Klaim:
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 text-base">
                      {formatCurrency(data.total_claim)}
                    </td>
                    <td colSpan={2} className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Lampiran Kwitansi / Berkas */}
          {data.attachments && data.attachments.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-purple-600" />
                Bukti Kwitansi / Lampiran Berkas ({data.attachments.length})
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
        </ComponentCard>

        {/* Timeline Approval */}
        <ReimbursementTimeline approvals={data.approvals} />
      </div>

      <DeactiveModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        url={`reimbursements/${data.id}`}
        selectedData={data}
        itemName={data.document_number || data.purpose || ""}
        onSuccess={() => router.push('/reimbursements/my-reimbursements')}
        message="Pengajuan reimbursement berhasil dihapus!"
      />

      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        imageTitle={previewImage?.title || 'Preview Berkas'}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}
