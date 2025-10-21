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
    requires_driver: number; // Added
    user: {
        id_user: string;
        nama_user: string;
    };
    cabang: {
        id_cab: number;
        nama_cab: string;
    };
    vehicle_type: { // Added based on response
        id: number;
        name: string;
    } | null;
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
    const router = useRouter();
    // const [isExportModalOpen, setIsExportModalOpen] = useState(false); // If using export modal

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
                return (
                    <div className="flex items-center justify-center"> 
                        <button
                            onClick={() => router.push(`/vehicles/manage-requests/${request.id}`)}
                            title="Lihat Detail & Proses"
                            className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                );
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
            id: "requires_driver",
            header: "Butuh Supir?",
            accessorFn: (row: any) => row.requires_driver === 1 ? "Ya" : "Tidak",
            cell: ({ row }: { row: any }) => (
                <span>{row.requires_driver === 1 ? "Ya" : "Tidak"}</span>
            ),
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
                else if (status === 'Completed') color = 'success';

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

   

   
  
   

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center gap-2">
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

            

            {/* <ExportVehicleRequestModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            /> */}
        </div>
    );
}