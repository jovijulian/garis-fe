"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { endpointUrl, httpGet } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { FaEdit, FaTrash, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import ChangeStatusModal from "@/components/modal/ChangeStatusModal";
import RescheduleModal from '@/components/modal/RescheduleModal';

interface BookingDataItem {
    id: number;
    purpose: string;
    booking_date: string;
    start_time: string;
    duration_minutes: number;
    is_conflicting?: boolean;
    status: 'Submit' | 'Approved' | 'Rejected';
    user: {
        id: number;
        name: string;
    };
    room: {
        id: number;
        name: string;
    };
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

    // State untuk Modals
    const [selectedData, setSelectedData] = useState<BookingDataItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

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

            // 2. Path data disesuaikan dengan response API
            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch bookings data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset ke halaman pertama saat mencari
    };

    // 3. Kolom tabel diubah total sesuai kebutuhan booking
    const columns = useMemo(() => [
        {
            id: "action",
            header: "Action",
            cell: ({ row }: { row: any }) => {
                const booking = row;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setSelectedData(booking);
                                if (booking.is_conflicting && booking.status == 'Submit') {
                                    setIsRescheduleModalOpen(true);
                                } else {
                                    setIsStatusModalOpen(true);
                                }
                            }}
                            title={booking.is_conflicting ? "Reschedule" : "Change Status"}
                            className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                        >
                            <FaEdit className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
        },
        {
            id: "room_name",
            header: "Room Name",
            accessorKey: "room.name",
            cell: ({ row }: { row: any }) => {
                const booking = row;
                return (
                    <div className="flex items-center gap-2">
                        <span>{booking.room.name}</span>
                        {booking.is_conflicting && booking.status == "Submit" && (
                            <FaExclamationTriangle
                                className="text-orange-500"
                                title="This schedule conflicts with another booking"
                            />
                        )}
                    </div>
                );
            },
        },
        {
            id: "user_name",
            header: "Booked By",
            accessorKey: "user.name",
            cell: ({ row }: any) => <span>{row.user.name}</span>,
        },
        {
            id: "purpose",
            header: "Purpose",
            accessorKey: "purpose",
        },
        {
            id: "booking_date",
            header: "Date",
            cell: ({ row }: { row: any }) => (
                <span>{moment(row.booking_date).format("DD MMM YYYY")}</span>
            ),
        },
        {
            id: "time",
            header: "Time",
            cell: ({ row }: { row: any }) => {
                const startTime = moment(row.start_time, "HH:mm:ss");
                const endTime = startTime.clone().add(row.duration_minutes, 'minutes');
                return `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`;
            },
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }: { row: any }) => {
                const status = row.status;
                const color = status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'warning';
                return <Badge color={color}>{status}</Badge>;
            },
        },
    ], []);

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search by purpose, room, or user..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
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

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                url={`bookings/${selectedData?.id}`} // 4. URL disesuaikan ke 'bookings'
                itemName={selectedData?.purpose || ""}
                onSuccess={getData}
                message="Booking deleted successfully!"
                selectedData={selectedData}
            />

            {/* 5. Menggunakan Modal baru untuk ubah status */}
            <ChangeStatusModal
                isOpen={isStatusModalOpen}
                booking={selectedData}
                onClose={() => setIsStatusModalOpen(false)}
                onSuccess={getData}
            />

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                booking={selectedData}
                onClose={() => setIsRescheduleModalOpen(false)}
                onSuccess={getData}
            />
        </div>
    );
}