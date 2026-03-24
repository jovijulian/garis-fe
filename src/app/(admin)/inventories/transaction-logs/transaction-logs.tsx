"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, httpGet } from "@/../helpers";
import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment";
import { toast } from "react-toastify";
import Select from "@/components/form/Select-custom";
import _ from "lodash";
import ComponentCard from "@/components/common/ComponentCard";
import { ArrowDownRight, ArrowUpRight, RefreshCcw, Package } from "lucide-react";

export default function TransactionLogsPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isLoading, setIsLoading] = useState(false);

    const [data, setData] = useState<any[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('');
    const [transactionType, setTransactionType] = useState('');

    const transactionTypeOptions = [
        { value: '', label: 'Semua Tipe Transaksi' },
        { value: 'STOCK_IN', label: 'Barang Masuk (STOCK IN)' },
        { value: 'OUT_BHP', label: 'Keluar BHP (OUT BHP)' },
        { value: 'OUT_ASSET', label: 'Peminjaman Aset (OUT ASSET)' },
        { value: 'RETURN', label: 'Pengembalian (RETURN)' },
    ];

    useEffect(() => {
        getData();
    }, [currentPage, perPage, searchTerm, transactionType]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();

        const params: any = {
            ...(search ? { search } : {}),
            ...(transactionType ? { transaction_type: transactionType } : {}),
            per_page: perPage,
            page: currentPage,
        };

        try {
            const response = await httpGet(endpointUrl("inventory-transactions"), true, params);
            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat log transaksi.");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getTransactionBadge = (type: string) => {
        switch (type) {
            case 'STOCK_IN':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><ArrowDownRight className="w-3.5 h-3.5" /> Masuk</span>;
            case 'OUT_BHP':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"><ArrowUpRight className="w-3.5 h-3.5" /> Keluar BHP</span>;
            case 'OUT_ASSET':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700"><ArrowUpRight className="w-3.5 h-3.5" /> Pinjam Aset</span>;
            case 'RETURN':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><RefreshCcw className="w-3.5 h-3.5" /> Return</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">{type}</span>;
        }
    };

    const columnsNew = useMemo(() => [
        {
            id: "created_at",
            header: "Tgl Transaksi",
            accessorKey: "created_at",
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{moment(row.created_at).format("DD MMM YYYY")}</span>
                    <span className="text-xs text-gray-500">{moment(row.created_at).format("HH:mm")}</span>
                </div>
            ),
        },
        {
            id: "transaction_type",
            header: "Tipe",
            accessorKey: "transaction_type",
            cell: ({ row }: any) => getTransactionBadge(row.transaction_type),
        },
        {
            id: "item_name",
            header: "Barang",
            accessorKey: "item.name",
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/inventories/items/${row.item_id}`)}>
                        {row.item?.name || "-"}
                    </span>
                    <span className="text-xs text-gray-500">{row.item?.barcode || ""}</span>
                </div>
            ),
        },
        {
            id: "qty",
            header: "Qty (Base Unit)",
            accessorKey: "qty",
            cell: ({ row }: any) => {
                const isOut = row.transaction_type.includes('OUT');
                return (
                    <span className={`font-bold ${isOut ? 'text-red-600' : 'text-green-600'}`}>
                        {isOut ? '-' : '+'}{row.qty} {row.item?.base_unit?.name}
                    </span>
                );
            },
        },
        {
            id: "nik",
            header: "Peminjam/Peminta",
            accessorKey: "nik",
            cell: ({ row }: any) => {
                if (!row.nik) return <span className="text-gray-400">-</span>;
                return (
                    <span
                        onClick={() => router.push(`/inventories/users/${row.nik}`)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        title="Lihat detail riwayat karyawan ini"
                    >
                        {row.nik}
                    </span>
                );
            }
        },
        {
            id: "created_by",
            header: "Dibuat Oleh",
            accessorKey: "created_by",
            cell: ({ row }: any) => <span className="text-sm text-gray-600">{row.created_by_user?.nama_user || row.created_by}</span>,
        },
    ], []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Filter Pencarian</h2>
                        <p className="text-xs text-gray-500">Gunakan filter untuk melacak pergerakan barang</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="w-full sm:w-56">
                        <Select
                            options={transactionTypeOptions}
                            value={_.find(transactionTypeOptions, { value: transactionType }) || transactionTypeOptions[0]}
                            onValueChange={(opt) => {
                                setTransactionType(opt?.value || "");
                                setCurrentPage(1);
                            }}
                            placeholder="Pilih Tipe Transaksi"
                        />
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Cari NIK atau Nama Barang..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <Table
                    data={data}
                    columns={columnsNew}
                    pagination={true}
                    lastPage={lastPage}
                    total={count}
                    loading={isLoading}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </div>
    );
}