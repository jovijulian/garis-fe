"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, httpGet } from "@/../helpers";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import 'moment/locale/id';
import { toast } from "react-toastify";
import { Check, X, Eye, Search } from "lucide-react";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import ProjectAdminApprovalModal from "@/components/projects/ProjectAdminApprovalModal";
import { ProjectRequestListItem } from "@/types/project";

export default function ManageProjectRequestsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<ProjectRequestListItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedRequest, setSelectedRequest] = useState<ProjectRequestListItem | null>(null);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

    useEffect(() => {
        getData();
    }, [searchParams, currentPage, perPage, searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();
        const page = searchParams.get("page") || currentPage;
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            ...(search && { search }),
            per_page: perPageParam,
            page: page,
        };

        try {
            const response = await httpGet(endpointUrl("/project-requests"), true, params);
            const responseData = response?.data?.data;
            setData(responseData?.data || []);
            setCount(responseData?.pagination?.total || 0);
            setLastPage(responseData?.pagination?.total_pages || 1);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data pengajuan proyek");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleOpenApprovalModal = (request: ProjectRequestListItem, action: 'APPROVED' | 'REJECTED') => {
        setSelectedRequest(request);
        setActionType(action);
        setIsApprovalModalOpen(true);
    };

    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            cell: ({ row }: { row: ProjectRequestListItem }) => {
                const request = row;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/projects/manage-request/${request.id}`)}
                            title="Lihat Detail"
                            className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
        },
        {
            id: "document_number",
            header: "No. Dokumen",
            accessorFn: (row: ProjectRequestListItem) => row.document_number,
            cell: ({ row }: { row: ProjectRequestListItem }) => (
                <div

                >
                    <span className="font-bold">
                        {row.document_number}
                    </span>
                </div>
            ),
        },
        {
            id: "requester",
            header: "Pemohon & Dept",
            accessorFn: (row: ProjectRequestListItem) => row.requester?.nama_user,
            cell: ({ row }: { row: ProjectRequestListItem }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                        {row.requester?.nama_user || row.user_id}
                    </span>
                    <span className="text-xs text-gray-500">
                        Dept: <span className="font-semibold">{row.department?.nama_dept || "-"}</span>
                    </span>
                </div>
            ),
        },
        {
            id: "request_date",
            header: "Tanggal Pengajuan",
            accessorFn: (row: ProjectRequestListItem) => row.request_date,
            cell: ({ row }: { row: ProjectRequestListItem }) => (
                <span className="text-xs text-gray-600 whitespace-nowrap">
                    {moment(row.request_date).format("DD MMM YYYY, HH:mm")}
                </span>
            ),
        },
        {
            id: "status",
            header: "Status",
            accessorFn: (row: ProjectRequestListItem) => row.status,
            cell: ({ row }: { row: ProjectRequestListItem }) => (
                <ProjectStatusBadge status={row.status} size="sm" />
            ),
        },
        {
            id: "created_at",
            header: "Dibuat pada",
            accessorFn: (row: any) => row.created_at,
            cell: ({ row }: { row: any }) => (
                <span>{moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}</span>
            ),
        },

    ], [router]);

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
                {/* <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <FileDown size={18} />
                    <span>Export</span>
                </button> */}

            </div>
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

            <ProjectAdminApprovalModal
                isOpen={isApprovalModalOpen}
                onClose={() => {
                    setIsApprovalModalOpen(false);
                    setSelectedRequest(null);
                }}
                requestId={selectedRequest?.id || null}
                actionType={actionType}
                onSuccess={getData}
            />
        </div>
    );
}