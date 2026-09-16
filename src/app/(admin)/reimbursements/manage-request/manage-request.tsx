"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Table from "@/components/tables/Table";
import { endpointUrl, httpGet } from "@/../helpers";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import "moment/locale/id";
import { toast } from "react-toastify";
import { Eye, Check, X, Printer, Search, RefreshCw, Loader2 } from "lucide-react";
import ReimbursementStatusBadge from "@/components/reimbursements/ReimbursementStatusBadge";
import ReimbursementAdminApprovalModal from "@/components/reimbursements/ReimbursementAdminApprovalModal";
import { ReimbursementListItem } from "@/types/reimbursement";

export default function ManageReimbursementRequestsContent() {
  moment.locale("id");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReimbursementListItem[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<ReimbursementListItem | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [isPrintingId, setIsPrintingId] = useState<number | null>(null);

  const getData = useCallback(async () => {
    setIsLoading(true);
    const search = searchTerm.trim();
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : currentPage;
    const perPageParam = searchParams.get("per_page") ? Number(searchParams.get("per_page")) : perPage;

    const params: any = {
      ...(search && { search }),
      per_page: perPageParam,
      page: page,
    };

    try {
      const response = await httpGet(endpointUrl("/reimbursements"), true, params);
      const responseData = response?.data?.data;
      setData(responseData?.data || []);
      setCount(responseData?.pagination?.total || 0);
      setLastPage(responseData?.pagination?.total_pages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data pengajuan reimbursement");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, searchParams, currentPage, perPage]);

  useEffect(() => {
    getData();
  }, [getData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenApprovalModal = (
    request: ReimbursementListItem,
    action: "APPROVED" | "REJECTED"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setIsApprovalModalOpen(true);
  };

  const handlePrint = async (id: number) => {
    setIsPrintingId(id);
    try {
      const response = await httpGet(endpointUrl(`/reimbursements/${id}/print`), true);
      const htmlContent = response.data;

      if (!htmlContent) {
        toast.error("Gagal mendapatkan dokumen cetak.");
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
      console.error("Gagal mencetak nota reimbursement:", error);
      toast.error("Terjadi kesalahan saat menyiapkan cetak PDF.");
    } finally {
      setIsPrintingId(null);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return `Rp ${Number(num || 0).toLocaleString("id-ID")}`;
  };

  const columns = useMemo(
    () => [
      {
        id: "action",
        header: "Aksi",
        cell: ({ row }: { row: ReimbursementListItem }) => {
          const request = row;
          const isPrinting = isPrintingId === request.id;

          return (
            <div className="flex items-center gap-2">
              {/* Detail button */}
              <button
                type="button"
                onClick={() => router.push(`/reimbursements/manage-request/${request.id}`)}
                title="Lihat Detail"
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Quick approve / reject buttons if WAITING_GA */}
              {request.status === "WAITING_GA" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenApprovalModal(request, "APPROVED")}
                    title="Setujui Pengajuan"
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenApprovalModal(request, "REJECTED")}
                    title="Tolak Pengajuan"
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Print button if CLOSED */}
              {request.status === "CLOSED" && (
                <button
                  type="button"
                  onClick={() => handlePrint(request.id)}
                  disabled={isPrinting}
                  title="Cetak PDF"
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          );
        },
      },
      {
        id: "document_number",
        header: "No. Dokumen",
        accessorFn: (row: ReimbursementListItem) => row.document_number,
        cell: ({ row }: { row: ReimbursementListItem }) => (
          <button
            type="button"
            onClick={() => router.push(`/reimbursements/manage-request/${row.id}`)}
            className="font-bold text-gray-800 hover:text-blue-600 transition-colors text-left"
          >
            {row.document_number}
          </button>
        ),
      },
      {
        id: "requester",
        header: "Pemohon",
        accessorFn: (row: ReimbursementListItem) => row.requester?.nama_user,
        cell: ({ row }: { row: ReimbursementListItem }) => (
            <div className="flex flex-col items-start gap-2 cursor-pointer">
              <span className="font-semibold text-gray-800 hover:underline">{row.requester?.nama_user}</span>
              <div className="flex  items-center gap-x-3 gap-y-1 text-gray-500">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      <span className="font-medium">{row.department ? row.department?.nama_dept : "-"}</span>
                  </div>
              </div>
          </div>
        ),
      },
      {
        id: "destination",
        header: "Tujuan & Keperluan",
        cell: ({ row }: { row: ReimbursementListItem }) => (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-semibold text-gray-800 ">
              {row.destination || "-"}
            </span>
            <span className=" text-gray-500 truncate" title={row.purpose || ""}>
              {row.purpose || "-"}
            </span>
          </div>
        ),
      },
      // {
      //   id: "period",
      //   header: "Periode & Durasi",
      //   cell: ({ row }: { row: ReimbursementListItem }) => (
      //     <div className="flex flex-col text-xs">
      //       <span className="text-gray-700 whitespace-nowrap">
      //         {moment(row.start_date).format("DD MMM YYYY")} - {moment(row.end_date).format("DD MMM YYYY")}
      //       </span>
      //       <span className="text-gray-500">
      //         {row.duration} {row.duration_type || "Hari"} ({row.participant_count || 1} orang)
      //       </span>
      //     </div>
      //   ),
      // },
      {
        id: "total_claim",
        header: "Total Klaim",
        accessorFn: (row: ReimbursementListItem) => row.total_claim,
        cell: ({ row }: { row: ReimbursementListItem }) => (
          <span className="font-bold text-emerald-600  whitespace-nowrap">
            {formatCurrency(row.total_claim)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row: ReimbursementListItem) => row.status,
        cell: ({ row }: { row: ReimbursementListItem }) => (
          <ReimbursementStatusBadge status={row.status} size="sm" />
        ),
      },
      {
        id: "created_at",
        header: "Dibuat Pada",
        accessorFn: (row: ReimbursementListItem) => row.created_at,
        cell: ({ row }: { row: ReimbursementListItem }) => (
          <span className="whitespace-nowrap">
            {moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}
          </span>
        ),
      },
    ],
    [router, isPrintingId]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search..."
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main Table */}
      <Table
        data={data}
        columns={columns}
        pagination={true}
        lastPage={lastPage}
        total={count}
        loading={isLoading}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />

      {/* Approval Modal */}
      <ReimbursementAdminApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedRequest(null);
        }}
        requestId={selectedRequest?.id || null}
        documentNumber={selectedRequest?.document_number}
        actionType={actionType}
        onSuccess={getData}
      />
    </div>
  );
}
