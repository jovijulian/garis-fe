"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, PackageOpen, ChevronLeft, ChevronRight, PackageMinus } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import LoanCard from '@/components/inventory/LoanCard'; // Pastikan path import sesuai

interface InventoryLoan {
    id: number;
    transaction_id: number;
    item_id: number;
    nik: string;
    qty_borrowed: number;
    qty_returned: number;
    status: 'BORROWED' | 'PARTIAL_RETURNED' | 'RETURNED';
    borrowed_at: string;
    returned_at: string | null;
    item: {
        id: number;
        name: string;
        barcode: string;
        base_unit?: { id: number, name: string };
    };
    created_by_user: {
        id_user: string;
        nama_user: string;
    };
}

export default function MyLoanPage() {
    const searchParams = useSearchParams();
    const [loans, setLoans] = useState<InventoryLoan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State Paginasi (Persis seperti Vehicle Request)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(6);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    const fetchData = async () => {
        const page = searchParams.get("page") || Number(currentPage);
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            per_page: perPageParam,
            page: Number(page),
        };

        try {
            setError(null);
            setIsLoading(true);
            const response = await httpGet(endpointUrl("inventory-loans/user"), true, params);
            const responseData = response.data.data;
            
            setLoans(responseData.data || []);
            setCount(responseData.total || 0);
            setLastPage(Math.ceil((responseData.total || 0) / (responseData.per_page || 6)));
            setCurrentPage(Number(responseData.page) || 1);
        } catch (err) {
            console.error(err);
            setError("Gagal memuat daftar tanggungan aset Anda.");
            toast.error("Gagal memuat daftar tanggungan aset Anda.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        fetchData();
    }, [searchParams, currentPage, perPage]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-4 text-gray-700">Memuat data tanggungan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] text-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Terjadi Kesalahan</h2>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header Area */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                        <PackageMinus className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tanggungan Aset Saya</h1>
                        <p className="text-sm text-gray-500 mt-1">Daftar inventaris perusahaan yang wajib Anda kembalikan.</p>
                    </div>
                </div>
            </div>

            {/* List Content */}
            {loans.length > 0 ? (
                <>
                    {/* Grid Cards (Persis seperti Vehicle Request) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loans.map(loan => (
                            <LoanCard key={loan.id} loan={loan} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {count > 0 && lastPage > 1 && (
                        <div className="flex items-center justify-between pt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <span className="text-sm text-gray-600">
                                Total {count} tanggungan aset
                            </span>
                            <div className="inline-flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-semibold text-gray-700">
                                    Halaman {currentPage} dari {lastPage}
                                </span>
                                <button
                                    onClick={() => handlePageChange(Number(currentPage) + 1)}
                                    disabled={currentPage === lastPage}
                                    className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PackageOpen className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Bebas Tanggungan! 🎉</h3>
                    <p className="text-gray-500 mt-2 max-w-sm text-sm mx-auto">
                        Anda tidak memiliki aset perusahaan yang sedang dipinjam. Terima kasih telah menjaga inventaris kantor!
                    </p>
                </div>
            )}
        </div>
    );
}