"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { endpointUrl, httpGet } from '@/../helpers';
import { toast } from 'react-toastify';
import TransportCard from '@/components/transport/TransporCard'; 
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { useRouter, useSearchParams } from 'next/navigation';

interface Transport {
    id: number;
    purpose: string
    date: string;
    time: string;
    origin: string;
    destination: string;
    transport_type: {
        id: number;
        name: string;
    }
    total_pax: number;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
}

export default function TransportOrders() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Transport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(6);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Transport | null>(null);

    const fetchUserOrders = async () => {
        setIsLoading(true);
        const page = searchParams.get("page") || Number(currentPage);
        const params: any = {
            per_page: perPage,
            page: Number(page),
        };
        try {
            setError(null);
            const response = await httpGet(endpointUrl("/transport-orders/user"), true, params);
            const responseData = response.data.data;
            setOrders(responseData.data || []);
            setCount(responseData.pagination.total);
            setLastPage(responseData.pagination.total_pages);
            setCurrentPage(responseData.pagination.page);
        } catch (err) {
            console.error(err);
            setError("Gagal memuat daftar pesanan transportasi.");
            toast.error("Gagal memuat data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenEditModal = (order: Transport) => {
        router.push(`/orders/my-orders/transport/edit/${order.id}`);
    };

    const handleOpenDeleteModal = (order: Transport) => {
        setSelectedOrder(order);
        setDeleteModalOpen(true);
    };

    useEffect(() => {
        fetchUserOrders();
    }, [currentPage]);

    if (isLoading) {
        return (
             <div className="flex justify-center items-center h-60">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-60 text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-end mb-4">
                <button
                    onClick={() => router.push('/orders/create-transport')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow"
                >
                    <Plus className="w-4 h-4" />
                    <span>Ajukan Transportasi</span>
                </button>
            </div>

            {orders.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map(order => (
                            <TransportCard
                                key={order.id}
                                transport={order}
                                onEdit={() => handleOpenEditModal(order)}
                                onDelete={() => handleOpenDeleteModal(order)}
                            />
                        ))}
                    </div>

                    {count > 0 && lastPage > 1 && (
                        <div className="flex items-center justify-between pt-6 border-t mt-6">
                            <span className="text-sm text-gray-600">Total {count} data</span>
                            <div className="inline-flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-semibold text-gray-700">
                                    {currentPage} / {lastPage}
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
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Info className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-700">Belum ada pesanan transportasi</h3>
                    <p className="text-gray-500 text-sm mt-1">Butuh booking transportasi? Buat pengajuan sekarang.</p>
                </div>
            )}

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedOrder(null);
                }}
                url={`transport-orders/${selectedOrder?.id}`}
                itemName={selectedOrder?.purpose || ""}
                selectedData={selectedOrder}
                onSuccess={fetchUserOrders}
                message="Order berhasil dibatalkan!"
            />
        </div>
    );
}