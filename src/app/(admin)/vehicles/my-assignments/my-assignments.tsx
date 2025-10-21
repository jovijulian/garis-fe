"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Plus, Info, Router, ChevronLeft, ChevronRight } from 'lucide-react';
import { endpointUrl, httpGet, httpPut } from '../../../../../helpers';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import AssignmentCard from '@/components/vehicle-request/Assignment';

interface Assignment {
    id: number;
    note_for_driver: string | null;
    vehicle: {
        id: number;
        name: string;
        license_plate: string;
    };
    vehicle_request: {
        id: number;
        purpose: string;
        destination: string;
        start_time: string;
        status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
        user: { nama_user: string };
        cabang: { nama_cab: string };
        pickup_location_text: string | null;
        passenger_count: number;
        passenger_names: string | null;
    };
}

export default function MyOrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(6);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
    const [targetRequestId, setTargetRequestId] = useState<number | null>(null);
    const [targetStatus, setTargetStatus] = useState<'In Progress' | 'Completed' | null>(null);

    const fetchAssignments = async () => {
        const page = searchParams.get("page") || Number(currentPage);
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            per_page: perPageParam,
            page: Number(page),
        };
        try {
            setError(null);
            setIsLoading(true);
            const response = await httpGet(endpointUrl("/vehicle-requests/driver"), true, params);
            const responseData = response.data.data;
            setAssignments(responseData.data || []);
            setCount(responseData.pagination.total);
            setLastPage(responseData.pagination.total_pages);
            setCurrentPage(responseData.pagination.page);
        } catch (err) {
            console.error(err);
            setError("Gagal memuat daftar pesanan Anda.");
            toast.error("Gagal memuat daftar pesanan Anda.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleTriggerStatus = async (requestId: number, newStatus: 'In Progress' | 'Completed') => {
        setIsSubmittingStatus(true);
        setTargetRequestId(requestId);
        setTargetStatus(newStatus);
        try {
            await httpPut(endpointUrl(`vehicle-requests/status/${requestId}`), { status: newStatus }, true);
            toast.success(`Status berhasil diubah menjadi "${newStatus}"`);
            fetchAssignments();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmittingStatus(false);
            setTargetRequestId(null);
            setTargetStatus(null);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [searchParams, currentPage, perPage]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-4 text-gray-700">Memuat riwayat pemesanan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Terjadi Kesalahan</h2>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

                {assignments.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignments.map(assignment => (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    onDetailClick={() => router.push(`/vehicles/my-assignments/${assignment.vehicle_request.id}`)}
                                    onTriggerStatus={handleTriggerStatus}
                                    isSubmittingStatus={isSubmittingStatus}
                                    targetRequestId={targetRequestId}
                                    targetStatus={targetStatus}
                                />
                            ))}
                        </div>

                        {count > 0 && lastPage > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <span className="text-sm text-gray-600">
                                    Total {count} penugasan
                                </span>
                                <div className="inline-flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-700">
                                        Halaman {currentPage} dari {lastPage}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(Number(currentPage) + 1)}
                                        disabled={currentPage === lastPage}
                                        className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10">
                        <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-700">Belum Ada Penugasan Aktif</h3>
                        <p className="text-gray-500 mt-2">Anda saat ini tidak memiliki penugasan kendaraan.</p>
                    </div>
                )}
            </div>
        </>
    );
}