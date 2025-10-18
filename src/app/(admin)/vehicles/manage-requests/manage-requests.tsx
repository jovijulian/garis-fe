"use client";

// --- Imports ---
import Table from "@/components/tables/Table"; 
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge"; 
import { endpointUrl, httpGet, httpPut } from "@/../helpers"; 
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import 'moment/locale/id';
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { CircleX, FileDown, Eye } from "lucide-react";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import CancelOrderModal from '@/components/modal/CancelOrderModal';
// import ExportVehicleRequestModal from '@/components/modal/ExportVehicleRequestModal'; // Example name

interface VehicleRequestDataItem {
    id: number;
    purpose: string;
    destination: string; 
    start_time: string; 
    passenger_count: number; 
    pickup_location_text: string | null;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress'; 
    user: {
        id_user: string;
        nama_user: string;
    };
    cabang: {
        id_cab: number;
        nama_cab: string;
    };
    created_at: string; 
}

export default function ManageVehicleRequestsPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [requests, setRequests] = useState<VehicleRequestDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const router = useRouter();
    const [selectedData, setSelectedData] = useState<VehicleRequestDataItem | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [isExportModalOpen, setIsExportModalOpen] = useState(false); // If using export modal
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);

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

        const statusFilter = searchParams.get("status");

        const params: any = {
            ...(search && { search }),
            ...(statusFilter && { status: statusFilter }), 
            per_page: perPageParam,
            page: page,
        };

        try {
            const response = await httpGet(endpointUrl("vehicle-requests"), true, params);

            const responseData = response.data.data.data;
            setRequests(responseData); 
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data pengajuan kendaraan");
            setRequests([]); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            cell: ({ row }: { row: any }) => {
                const request = row;

                if (request.status === "Approved" ) {
                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenCancelModal(request)}
                                title="Batalkan Pengajuan"
                                className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                <CircleX className="w-4 h-4 text-red-500" />
                            </button>
                            {/* Add Print SPJ button here if needed later */}
                        </div>
                    );
                }

                if (request.status === "Submit") {
                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenModal(request, "Rejected")}
                                title="Tolak Pengajuan"
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleOpenModal(request, "Approved")}
                                title="Setujui Pengajuan"
                                className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                            >
                                <FaCheck className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }
            },
        },
        {
            id: "user",
            header: "Pemohon",
            accessorFn: (row: any) => row.user?.nama_user,
            cell: ({ row }: { row: any }) => {
                const request = row;
                return (
                    <div className="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline" onClick={() => {
                        router.push(`/vehicles/manage-requests/${row.id}`);
                    }}>
                        <span>{request.user?.nama_user}</span>
                    </div>
                );
            },
        },
        {
            id: "cabang",
            header: "Cabang Pemohon", 
            accessorFn: (row: any) => row.cabang?.nama_cab,
            cell: ({ row }: { row: any }) => <span>{row.cabang?.nama_cab}</span>,
        },
        {
            id: "pickup_location", 
            header: "Lokasi Jemput", 
            accessorFn: (row: any) => row.pickup_location_text || row.cabang?.nama_cab, 
            cell: ({ row }: { row: any }) => <span>{row.pickup_location_text || row.cabang?.nama_cab}</span>,
        },
        {
            id: "destination",
            header: "Tujuan",
            accessorFn: (row: any) => row.destination,
            cell: ({ row }: { row: any }) => <span>{row.destination}</span>,
        },
        {
            id: "start_time",
            header: "Waktu Mulai",
            accessorFn: (row: any) => row.start_time,
            cell: ({ row }: { row: any}) => (
                <span>{moment(row.start_time).format("DD MMM YYYY, HH:mm")}</span> 
            ),
        },
        {
            id: "passenger_count",
            header: "Penumpang",
            accessorKey: "passenger_count",
            cell: ({ row }: { row: any}) => <span>{row.passenger_count}</span>,
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: any}) => {
                const status = row.status;
                let color: "success" | "error" | "warning" | "info" | "warning" = "warning";
                if (status === 'Approved') color = 'success';
                else if (status === 'Rejected' || status === 'Canceled') color = 'error';
                else if (status === 'In Progress') color = 'warning';
                else if (status === 'Completed') color = 'info';

                return <Badge color={color}>{status}</Badge>;
            },
        },
        {
            id: "created_at",
            header: "Diajukan pada",
            accessorFn: (row: any) => row.created_at,
            cell: ({ row }: { row: any}) => (
                <span>{moment(row.created_at).format("DD MMM YYYY, HH:mm")}</span>
            ),
        },
    ], [router]); 

    const handleOpenModal = (request: VehicleRequestDataItem, action: 'Approved' | 'Rejected') => {
        setSelectedData(request);
        setActionType(action);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!actionType || !selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`vehicle-requests/status/${selectedData.id}`), { status: actionType }, true);
            toast.success(`Pengajuan berhasil diubah menjadi "${actionType}"`);
            getData(); // Refresh table
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };

    const handleOpenCancelModal = (request: VehicleRequestDataItem) => {
        setSelectedData(request);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`vehicles/cancel/${selectedData.id}`), {}, true);
            toast.success("Pengajuan berhasil dibatalkan.");
            getData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan pengajuan.");
        } finally {
            setIsSubmitting(false);
            setIsCancelModalOpen(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Cari..." 
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                />
                <div className="flex gap-2 flex-shrink-0">
                    {/* <button
                        onClick={() => setIsExportModalOpen(true)} // If using export
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FileDown size={18} />
                        <span>Export</span>
                    </button> */}
                    <button
                        onClick={() => router.push("/vehicles/create-admin")} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>+</span>
                        Tambah
                    </button>
                </div>
            </div>

            <Table
                data={requests} 
                columns={columns}
                pagination={true}
                lastPage={lastPage}
                total={count}
                loading={isLoading}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
            />

            <ChangeStatusOrderModal 
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onConfirm={handleUpdateStatus}
                order={selectedData} 
                actionType={actionType}
                isSubmitting={isSubmitting}
            />
            <CancelOrderModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                order={selectedData} 
                isSubmitting={isSubmitting}
            />

            {/* <ExportVehicleRequestModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            /> */}
        </div>
    );
}