"use client";

import Table from "@/components/tables/Table";
import { Metadata } from "next";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { toast } from "react-toastify";
import { Undo2, PackageOpen, Loader2 } from "lucide-react";

export default function AssetReturnPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const page = searchParams.get("page") || "1";
    const [data, setData] = useState<any[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [returnInputs, setReturnInputs] = useState<Record<number, number>>({});

    useEffect(() => {
        getData();
    }, [searchParams, currentPage, perPage, page, searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleQtyChange = (loanId: number, value: string, maxQty: number) => {
        const num = parseInt(value) || 0;
        if (num > maxQty) {
            toast.warning(`Maksimal barang yang bisa dikembalikan adalah ${maxQty}`);
            setReturnInputs(prev => ({ ...prev, [loanId]: maxQty }));
        } else {
            setReturnInputs(prev => ({ ...prev, [loanId]: num }));
        }
    };

    const handleSubmitReturn = async (loanId: number) => {
        const returnQty = returnInputs[loanId];
        if (!returnQty || returnQty <= 0) {
            toast.warning("Masukkan jumlah barang yang dikembalikan.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                loan_id: loanId,
                return_qty: returnQty,
                note: "Dikembalikan ke gudang"
            };

            await httpPost(endpointUrl("inventory-transactions/return"), payload, true);
            toast.success("Barang berhasil dikembalikan dan stok telah di-update!");
            setReturnInputs(prev => ({ ...prev, [loanId]: 0 }));
            getData();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memproses pengembalian.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const columnsNew = useMemo(() => {
        return [
            {
                id: "action",
                header: "Aksi Pengembalian",
                accessorKey: "action",
                cell: ({ row }: any) => {
                    const remaining = row.qty_borrowed - row.qty_returned;

                    return (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max={remaining}
                                placeholder="Qty"
                                disabled={isSubmitting}
                                value={returnInputs[row.id] || ''}
                                onChange={(e) => handleQtyChange(row.id, e.target.value, remaining)}
                                className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                            <button
                                onClick={() => handleSubmitReturn(row.id)}
                                disabled={!returnInputs[row.id] || isSubmitting}
                                className="flex justify-center items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
                            >
                                <Undo2 className="w-3.5 h-3.5" /> Kembalikan
                            </button>
                        </div>
                    );
                },
                minWidth: "200px",
            },
            {
                id: "nik",
                header: "Peminjam (NIK)",
                accessorKey: "nik",
                cell: ({ row }: any) => <span className="font-semibold text-gray-900">{row.nik || "-"}</span>,
            },
            {
                id: "item_name",
                header: "Nama Barang",
                accessorKey: "item.name",
                cell: ({ row }: any) => <span>{row.item?.name || "-"}</span>,
            },
            {
                id: "sisa_pinjam",
                header: "Sisa Belum Kembali",
                accessorKey: "sisa",
                cell: ({ row }: any) => {
                    const remaining = row.qty_borrowed - row.qty_returned;
                    const unitName = row.item?.base_unit?.name || 'Unit';
                    return (
                        <span className="inline-flex items-center justify-center bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            {remaining} {unitName}
                        </span>
                    );
                },
            },
            {
                id: "borrowed_at",
                header: "Tgl Pinjam",
                accessorKey: "borrowed_at",
                cell: ({ row }: any) => <span>{moment(row.borrowed_at).format("DD-MM-YYYY HH:mm")}</span>,
            },
            {
                id: "created_by",
                header: "Dibuat Oleh",
                accessorKey: "created_by",
                cell: ({ row }: any) => <span className="text-gray-500">{row.created_by_user?.nama_user || row.created_by}</span>,
            },
        ];
    }, [returnInputs, isSubmitting]); 

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();
        const page = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");

        const params: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: page ? Number(page) : currentPage,
        };

        try {
            const response = await httpGet(
                endpointUrl("inventory-loans"), true, params
            );

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />

                </div>
            </div>

            <Table
                data={data}
                columns={columnsNew}
                pagination={true}
                // selection={true}
                lastPage={lastPage}
                total={count}
                loading={isLoading}
                checkedData={selectedRows}
                setCheckedData={setSelectedRows}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}

            />


        </div>
    );
}