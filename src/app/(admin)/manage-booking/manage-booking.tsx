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
import ChangeStatusModal from "@/components/modal/ChangeStatusModal";
import RescheduleModal from '@/components/modal/RescheduleModal';
import CancelBookingModal from '@/components/modal/CancelBookingModal';
import { CircleX, FileDown, Trash2 } from "lucide-react";
import ExportModal from '@/components/modal/ExportModal'; 


interface BookingDataItem {
    id: number;
    purpose: string;
    start_time: string;
    end_time: string;
    is_conflicting: number;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    user: {
        id_user: string;
        nama_user: string;
    };
    room: {
        id: number;
        name: string;
    };
    topic: {
        id: number;
        name: string;
    };
    amenities: [];
    notes: string | null;
}

export default function ManageBookingPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<BookingDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const router = useRouter()
    const [selectedData, setSelectedData] = useState<BookingDataItem | null>(null);
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
            const response = await httpGet(endpointUrl("bookings"), true, params);

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data booking");
            setData([]);
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
                const booking = row;

                if (booking.is_conflicting === 1 && booking.status === "Submit") {
                  return (
                    <button
                      onClick={() => handleOpenRescheduleModal(booking)}
                      title="Selesaikan Konflik Jadwal"
                      className="p-2 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all flex items-center gap-2 text-sm"
                    >
                      <FaExclamationTriangle className="w-4 h-4" />
                      <span>Atur Ulang</span>
                    </button>
                  );
                }
            
                if (booking.status === "Approved") {
                  return (
                    <button
                      onClick={() => handleOpenCancelModal(booking)}
                      title="Batalkan Booking"
                      className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <CircleX className="w-4 h-4 text-red-500" />
                    </button>
                  );
                }
            
                if (booking.status === "Submit") {
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(booking, "Rejected")}
                        title="Tolak Booking"
                        className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(booking, "Approved")}
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
            id: "room_name",
            header: "Nama Ruangan",
            accessorKey: "room.name",
            accessorFn: (row: any) => row.room?.name,
            cell: ({ row }: { row: any }) => {
                const booking = row;
                return (
                    <div className="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline" onClick={() => {
                        router.push(`/manage-booking/${row.id}`);
                    }}>
                        <span>{booking.room.name}</span>
                        {booking.is_conflicting === 1 && booking.status === "Submit" && (
                            <FaExclamationTriangle
                                className="text-orange-500"
                                title="Jadwal ini bentrok dengan pengajuan lain"
                            />
                        )}
                    </div>
                );
            },
        },
        {
            id: "user_name",
            header: "Diajukan Oleh",
            accessorKey: "user.nama_user",
            accessorFn: (row: any) => row.user?.nama_user,
            cell: ({ row }: any) => <span>{row.user?.nama_user}</span>,
        },
        {
            id: "topic.name",
            header: "Topik Rapat",
            accessorKey: "topic.name",
            accessorFn: (row: any) => row.topic?.name,
            cell: ({ row }: any) => <span>{row.topic?.name}</span>,
        },
        {
            id: "purpose",
            header: "Keperluan",
            accessorKey: "purpose",
            accessorFn: (row: any) => row.purpose,
            cell: ({ row }: any) => <span>{row.purpose}</span>,
        },
        {
            id: "booking_date",
            header: "Tanggal",
            accessorFn: (row: any) => row.start_time,
            cell: ({ row }: { row: any }) => (
                <span>{moment(row.start_time).format("DD MMM YYYY")}</span>
            ),
        },
        {
            id: "time",
            header: "Waktu",
            accessorFn: (row: any) => row.start_time,
            cell: ({ row }: { row: any }) => {
                const startTime = moment(row.start_time).format("HH:mm");
                const endTime = moment(row.end_time).format("HH:mm");
                return `${startTime} - ${endTime}`;
            },
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

    const handleOpenModal = (booking: BookingDataItem, action: 'Approved' | 'Rejected') => {
        setSelectedData(booking);
        setActionType(action);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!actionType || !selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`bookings/status/${selectedData.id}`), { status: actionType }, true);
            toast.success(`Booking berhasil diubah menjadi "${actionType}"`);
            getData(); // Refresh tabel
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };

    const handleOpenRescheduleModal = (booking: BookingDataItem) => {
        setSelectedData(booking);
        setIsRescheduleModalOpen(true);
    };

    const handleOpenCancelModal = (booking: BookingDataItem) => {
        setSelectedData(booking);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedData) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`bookings/cancel/${selectedData.id}`), {}, true);
            toast.success("Booking berhasil dibatalkan.");
            getData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan booking.");
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
                    placeholder="Cari berdasarkan keperluan, ruangan, atau nama..."
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                 <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FileDown size={18} />
                        <span>Export</span>
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
            <ChangeStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onConfirm={handleUpdateStatus}
                booking={selectedData}
                actionType={actionType}
                isSubmitting={isSubmitting}
            />
            <CancelBookingModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                booking={selectedData}
                isSubmitting={isSubmitting}
            />

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                booking={selectedData}
                onClose={() => setIsRescheduleModalOpen(false)}
                onSuccess={getData}
            />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    );
}