"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Plus, Info, Router, ChevronLeft, ChevronRight } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';
import { toast } from 'react-toastify';
import OrderCard from '@/components/order/OrderCard';
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { useRouter, useSearchParams } from 'next/navigation';

interface Order {
    id: number;
    purpose: string;
    pax: number;
    location_text: string;
    order_date: string;
    status: 'Submit' | 'Approved' | 'Rejected';
    room: { name: string };
}

export default function MyOrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(6);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchUserOrders = async () => {
        const page = searchParams.get("page") || Number(currentPage);
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            per_page: perPageParam,
            page: Number(page),
        };
        try {
            setError(null);
            setIsLoading(true);
            const response = await httpGet(endpointUrl("/orders/user"), true, params);
            const responseData = response.data.data;
            setOrders(responseData.data || []);
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


    const handleOpenCreateModal = () => {
        setSelectedOrder(null);
        setFormModalOpen(true);
    };

    const handleOpenEditModal = (order: Order) => {
        router.push(`/orders/edit/${order.id}`);
    };

    const handleOpenDeleteModal = (order: Order) => {
        setSelectedOrder(order);
        setDeleteModalOpen(true);
    };

    useEffect(() => {
        fetchUserOrders();
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800"></h1>
                    <button
                        onClick={(e) => router.push('/orders/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Ajukan Pemesanan</span>
                    </button>
                </div>

                {orders.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onEdit={() => handleOpenEditModal(order)}
                                    onDelete={() => handleOpenDeleteModal(order)}
                                />
                            ))}
                        </div>

                        {count > 0 && lastPage > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <span className="text-sm text-gray-600">
                                    Total {count} pesanan
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
                        <h3 className="text-xl font-semibold text-gray-700">Belum Ada pemesanan</h3>
                        <p className="text-gray-500 mt-2">Anda belum pernah membuat pemesanan. Silakan ajukan pemesanan pertama Anda!</p>
                    </div>
                )}
            </div>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedOrder(null);
                }}
                url={`orders/${selectedOrder?.id}`}
                itemName={selectedOrder?.purpose || ""}
                selectedData={selectedOrder}
                onSuccess={fetchUserOrders}
                message="Order berhasil dibatalkan!"
            />
        </>
    );
}