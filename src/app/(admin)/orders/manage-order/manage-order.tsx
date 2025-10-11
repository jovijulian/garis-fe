"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import 'moment/locale/id';
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { FaEdit, FaTrash, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import RescheduleModal from '@/components/modal/RescheduleModal';
import CancelOrderModal from '@/components/modal/CancelOrderModal';
import { CircleX, FileDown, Trash2 } from "lucide-react";
import ExportOrderModal from '@/components/modal/ExportOrderModal';


interface OrderDataItem {
    id: number;
    booking: {
        id: number;
        purpose: string;
        start_time: string;
        end_time: string;
    };
    consumption_type: {
        id: number;
        name: string;
    },
    room: {
        id: number;
        name: string;
        location: string;
    }
    pax: number;
    location_text: string | null;
    order_time: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    user: {
        id_user: string;
        nama_user: string;
    };
    cabang: {
        id_cab: number;
        nama_cab: string;
    };
}

export default function ManageOrderPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<OrderDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const router = useRouter()
    const [selectedData, setSelectedData] = useState<OrderDataItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

        const params: any = {
            ...(search && { search }),
            per_page: perPageParam,
            page: page,
        };

        try {
            const response = await httpGet(endpointUrl("orders"), true, params);

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data order");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };
    const handlePrint = async (id: number) => {
        try {
            const response = await httpGet(endpointUrl(`/orders/${id}/receipt`), true);
            const htmlContent = response.data;

            if (!htmlContent) {
                toast.error('Gagal mendapatkan data nota untuk dicetak.');
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
            console.error('Gagal mencetak nota:', error);
            toast.error('Terjadi kesalahan saat menyiapkan nota.');
        }
    };

    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            cell: ({ row }: { row: any }) => {
                const order = row;

                if (order.status === "Approved") {
                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenCancelModal(order)}
                                title="Batalkan Booking"
                                className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                <CircleX className="w-4 h-4 text-red-500" />
                            </button>
                            <button
                                onClick={() => handlePrint(order.id)}
                                title="Cetak Nota"
                                className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                                <FileDown className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }

                if (order.status === "Submit") {
                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleOpenModal(order, "Rejected")}
                                title="Tolak Booking"
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleOpenModal(order, "Approved")}
                                title="Setujui Booking"
                                className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                            >
                                <FaCheck className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }
                return null;
            },
        },
        {
            id: "user",
            header: "Pemesan",
            accessorKey: "user",
            accessorFn: (row: any) => row.user?.nama_user,
            cell: ({ row }: { row: any }) => {
                const order = row;
                return (
                    <div className="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline" onClick={() => {
                        router.push(`/orders/manage-order/${row.id}`);
                    }}>
                        <span>{order.user?.nama_user}</span>
                    </div>
                );
            },
        },
        {
            id: "cabang",
            header: "Cabang",
            accessorKey: "cabang.nama_cab",
            accessorFn: (row: any) => row.cabang?.nama_cab,
            cell: ({ row }: any) => <span>{row.cabang?.nama_cab}</span>,
        },
        {
            id: "location_text",
            header: "Lokasi",
            accessorKey: "user.nama_user",
            accessorFn: (row: any) => row.room?.name || row.location_text,
            cell: ({ row }: any) => <span>{row.room ? row.room.name : row.location_text}</span>,
        },
        {
            id: "order_date",
            header: "Tanggal Pemesanan",
            accessorFn: (row: any) => row.order_date,
            cell: ({ row }: { row: any }) => (
                <span>{moment(row.order_date).format("DD MMM YYYY")}</span>
            ),
        },
        {
            id: "pax",
            header: "Jumlah Orang",
            accessorKey: "pax",
            accessorFn: (row: any) => row.pax,
            cell: ({ row }: any) => <span>{row.pax}</span>,
        },
        {
            id: "status",
            header: "Status",
            accessorFn: (row: any) => row.status,
            cell: ({ row }: { row: any }) => {
                const status = row.status;
                const color = status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'warning';
                return <Badge color={color}>{status}</Badge>;
            },
        },
        {
            id: "created_at",
            header: "Dibuat pada",
            accessorFn: (row: any) => row.created_at,
            cell: ({ row }: { row: any }) => (
                <span>{moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}</span>
            ),
        },
    ], []);

    const handleOpenModal = (booking: OrderDataItem, action: 'Approved' | 'Rejected') => {
        setSelectedData(booking);
        setActionType(action);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!actionType || !selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`orders/status/${selectedData.id}`), { status: actionType }, true);
            toast.success(`Order berhasil diubah menjadi "${actionType}"`);
            getData(); // Refresh tabel
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };

    const handleOpenCancelModal = (booking: OrderDataItem) => {
        setSelectedData(booking);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`orders/cancel/${selectedData.id}`), {}, true);
            toast.success("Order berhasil dibatalkan.");
            getData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan order.");
        } finally {
            setIsSubmitting(false);
            setIsCancelModalOpen(false);
        }
    };

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
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <FileDown size={18} />
                    <span>Export</span>
                </button>
                <button
                    onClick={() => router.push("/orders/create-admin")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+</span>
                    Tambah
                </button>
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

            <ExportOrderModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    );
}