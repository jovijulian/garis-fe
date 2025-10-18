"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Plus, Info, Router, ChevronLeft, ChevronRight } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';
import { toast } from 'react-toastify';
import VehicleRequestCard from '@/components/vehicle-request/VehicleRequest';
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { useRouter, useSearchParams } from 'next/navigation';

interface VehicleRequest {
    id: number;
    purpose: string;
    destination: string;
    passenger_count: number;
    start_time: string;
    end_time: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
    cabang: { id_cab: number; nama_cab: string; };
    vehicle_type: { id: number; name: string; } | null;
    pickup_location_text: string | null;
}

export default function MyVehicleRequestsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [requests, setRequests] = useState<VehicleRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(6);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);

    const fetchVehicleRequests = async () => {
        const page = searchParams.get("page") || Number(currentPage);
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            per_page: perPageParam,
            page: Number(page),
        };
        try {
            setError(null);
            setIsLoading(true);
            const response = await httpGet(endpointUrl("/vehicle-requests/user"), true, params);
            const responseData = response.data.data;
            setRequests(responseData.data || []);
            setCount(responseData.pagination.total);
            setLastPage(responseData.pagination.total_pages);
            setCurrentPage(responseData.pagination.page);
        } catch (err) {
            console.error(err);
            setError("Gagal memuat daftar pengajuan Anda.");
            toast.error("Gagal memuat daftar pengajuan Anda.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenEditModal = (request: VehicleRequest) => {
        router.push(`/vehicles/edit/${request.id}`);
    };

    const handleOpenDeleteModal = (request: VehicleRequest) => {
        setSelectedRequest(request);
        setDeleteModalOpen(true);
    };

    useEffect(() => {
        // 11. Fungsi fetch yang benar dipanggil
        fetchVehicleRequests();
    }, [searchParams, currentPage, perPage]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-4 text-gray-700">Memuat riwayat pengajuan...</p>
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800"></h1>
                    <button
                        onClick={(e) => router.push('/vehicles/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Ajukan Peminjaman</span>
                    </button>
                </div>

                {requests.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map(request => (
                                <VehicleRequestCard
                                    key={request.id}
                                    vehicleRequest={request}
                                    onEdit={() => handleOpenEditModal(request)}
                                    onDelete={() => handleOpenDeleteModal(request)}
                                />
                            ))}
                        </div>

                        {count > 0 && lastPage > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <span className="text-sm text-gray-600">
                                    Total {count} pengajuan
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
                    <div className="text-center py-20 bg-white rounded-2xl shadow">
                        <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-700">Belum Ada Pengajuan</h3>
                        <p className="text-gray-500 mt-2">Anda belum pernah membuat pengajuan kendaraan. Silakan ajukan pengajuan pertama Anda!</p>
                    </div>
                )}
            </div>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedRequest(null);
                }}
                url={`vehicle-requests/${selectedRequest?.id}`}
                itemName={selectedRequest?.purpose || ""}
                selectedData={selectedRequest}
                onSuccess={fetchVehicleRequests}
                message="Pengajuan berhasil dibatalkan!"
            />
        </>
    );
}