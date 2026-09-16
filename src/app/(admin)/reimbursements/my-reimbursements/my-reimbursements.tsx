"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { endpointUrl, httpGet } from '@/../helpers';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';

import ReimbursementCard from '@/components/reimbursements/ReimbursementCard';
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { ReimbursementListItem } from '@/types/reimbursement';

export default function MyReimbursementsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [requests, setRequests] = useState<ReimbursementListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(9);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ReimbursementListItem | null>(null);

    const fetchUserRequests = useCallback(async () => {
        const page = searchParams.get("page") || Number(currentPage);
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            per_page: perPageParam,
            page: Number(page),
        };
        try {
            setError(null);
            setIsLoading(true);
            const response = await httpGet(endpointUrl("/reimbursements/user"), true, params);
            const responseData = response?.data?.data;
            setRequests(responseData?.data || []);
            setCount(responseData?.pagination?.total || 0);
            setLastPage(responseData?.pagination?.total_pages || 1);
            setCurrentPage(responseData?.pagination?.page || 1);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.message || "Gagal memuat daftar pengajuan reimbursement Anda.");
            toast.error("Gagal memuat daftar pengajuan reimbursement Anda.");
        } finally {
            setIsLoading(false);
        }
    }, [searchParams, currentPage, perPage]);

    useEffect(() => {
        fetchUserRequests();
    }, [fetchUserRequests]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenEdit = (request: ReimbursementListItem) => {
        if (request.status !== 'WAITING_MANAGER') {
            toast.warning('Pengajuan hanya dapat diubah ketika status WAITING_MANAGER.');
            return;
        }
        router.push(`/reimbursements/edit/${request.id}`);
    };

    const handleOpenDelete = (request: ReimbursementListItem) => {
        if (request.status !== 'WAITING_MANAGER') {
            toast.warning('Pengajuan hanya dapat dihapus ketika status WAITING_MANAGER.');
            return;
        }
        setSelectedRequest(request);
        setDeleteModalOpen(true);
    };

    const handlePrint = async (id: number) => {
        try {
            const response = await httpGet(endpointUrl(`/reimbursements/${id}/print`), true);
            const htmlContent = response.data;

            if (!htmlContent) {
                toast.error('Gagal mendapatkan data untuk dicetak.');
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
        } catch (err) {
            console.error('Gagal mencetak dokumen reimbursement:', err);
            toast.error('Terjadi kesalahan saat menyiapkan form cetak.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-medium text-gray-600">Memuat riwayat pengajuan reimbursement...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                <h2 className="text-lg font-bold text-gray-800 mb-1">Terjadi Kesalahan</h2>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => fetchUserRequests()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
                    <button
                        onClick={() => router.push('/reimbursements/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Buat Pengajuan Reimbursement</span>
                    </button>
                </div>

                {requests.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map((request) => (
                                <ReimbursementCard
                                    key={request.id}
                                    reimbursement={request}
                                    onEdit={() => handleOpenEdit(request)}
                                    onDelete={() => handleOpenDelete(request)}
                                    onPrint={() => handlePrint(request.id)}
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
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-700">Belum Ada Pengajuan Reimbursement</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            Anda belum pernah membuat pengajuan reimbursement. Silakan buat pengajuan pertama Anda!
                        </p>
                        <button
                            onClick={() => router.push('/reimbursements/create')}
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Buat Pengajuan</span>
                        </button>
                    </div>
                )}
            </div>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedRequest(null);
                }}
                url={`reimbursements/${selectedRequest?.id}`}
                itemName={selectedRequest?.document_number || selectedRequest?.purpose || ""}
                selectedData={selectedRequest}
                onSuccess={fetchUserRequests}
                message="Pengajuan reimbursement berhasil dihapus!"
            />
        </>
    );
}
