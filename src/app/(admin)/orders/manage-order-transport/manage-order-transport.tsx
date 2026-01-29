"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { endpointUrl, httpGet, httpPut, getBadgeStatus } from "@/../helpers";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import 'moment/locale/id';
import { toast } from "react-toastify";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import CancelOrderModal from '@/components/modal/CancelOrderModal';
import ExportOrderModal from '@/components/modal/ExportOrderTransportModal';
import { CircleX, FileDown } from "lucide-react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";

interface TransportOrder {
    id: number;
    user_id: string;
    cab_id: number;
    transport_type_id: number;
    origin: string;
    origin_detail: string | null;
    destination: string;
    destination_detail: string | null;
    date: string;
    time: string;
    total_pax: number;
    transport_class: string | null;
    preferred_provider: string | null;
    purpose: string | null;
    note: string | null;

    status: TransportStatus;
    created_at: string;
    updated_at: string;
    approved_by: string | null;
    is_active: number;
    transport_type: { id: number; name: string };
    cabang: { id_cab: number; nama_cab: string };
    user: { id_user: string; nama_user: string };
}

type TransportStatus = "Submit" | "Approved" | "Rejected" | "Canceled";

export default function ManageTransportOrderPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [data, setData] = useState<TransportOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedData, setSelectedData] = useState<TransportOrder | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const response = await httpGet(endpointUrl("transport-orders"), true, params);

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data order transportasi");
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
            const response = await httpGet(endpointUrl(`/transport-orders/${id}/receipt`), true);
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


    const handleOpenModal = (order: TransportOrder, action: 'Approved' | 'Rejected') => {
        setSelectedData(order);
        setActionType(action);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!actionType || !selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`transport-orders/status/${selectedData.id}`), { status: actionType }, true);
            toast.success(`Order berhasil diubah menjadi "${actionType}"`);
            getData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };

    const handleOpenCancelModal = (order: TransportOrder) => {
        setSelectedData(order);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`transport-orders/cancel/${selectedData.id}`), {}, true);
            toast.success("Order berhasil dibatalkan.");
            getData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan order.");
        } finally {
            setIsSubmitting(false);
            setIsCancelModalOpen(false);
        }
    };


    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            cell: ({ row }: { row: TransportOrder }) => {
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
            accessorFn: (row: any) => row.user?.nama_user,
            cell: ({ row }: { row: any }) => {
                const request = row;
                return (
                    <div className="flex flex-col items-start gap-2 cursor-pointer" onClick={() => {
                        router.push(`/orders/manage-order-transport/${row.id}`)
                    }}>
                        <span className="font-semibold text-blue-600 hover:underline">{request.user?.nama_user}</span>
                        <span className="text-xs text-gray-500">Cabang pemesan: <span className="font-semibold">{request.cabang?.nama_cab}</span></span>
                    </div>
                );
            },
        },
        // {
        //     id: "user",
        //     header: "Pemesan",
        //     accessorKey: "user.nama_user",
        //     cell: ({ row }: { row: TransportOrder }) => {
        //         return (
        //             <div
        //                 className="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline"
        //                 onClick={() => router.push(`/orders/manage-order-transport/${row.id}`)}
        //             >
        //                 <span>{row.user?.nama_user}</span>
        //             </div>
        //         );
        //     },
        // },
        {
            id: "transport_type",
            header: "Jenis",
            accessorKey: "transport_type.name",
            cell: ({ row }: { row: TransportOrder }) => (
                <span>{row.transport_type?.name}</span>
            ),
        },
        {
            id: "origin",
            header: "Asal",
            accessorKey: "origin",
            cell: ({ row }: { row: TransportOrder }) => <span>{row.origin}</span>,
        },
        {
            id: "destination",
            header: "Tujuan",
            accessorKey: "destination",
            cell: ({ row }: { row: TransportOrder }) => <span>{row.destination}</span>,
        },
        {
            id: "date",
            header: "Tgl Berangkat",
            accessorKey: "date",
            cell: ({ row }: { row: TransportOrder }) => (
                <div className="flex flex-col text-sm">
                    <span className="font-medium">{moment(row.date).format("DD MMM YYYY")}</span>
                    <span className="text-gray-500 text-xs">{row.time}</span>
                </div>
            ),
        },
        {
            id: "total_pax",
            header: "Pax",
            accessorKey: "total_pax",
            cell: ({ row }: { row: TransportOrder }) => <span className="text-center block">{row.total_pax}</span>,
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: TransportOrder }) => {
                return <Badge {...getBadgeStatus(row.status)} />
            },
        },
        {
            id: "created_at",
            header: "Dibuat",
            accessorKey: "created_at",
            cell: ({ row }: { row: TransportOrder }) => (
                <span className="text-xs text-gray-500">{moment(row.created_at).format("DD/MM/YY HH:mm")}</span>
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
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                >
                    <FileDown size={18} />
                    <span>Export</span>
                </button>
                <button
                    onClick={() => router.push("/orders/create-transport-admin")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
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