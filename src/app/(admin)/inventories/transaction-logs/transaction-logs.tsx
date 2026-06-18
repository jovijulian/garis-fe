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
import { ArrowDownRight, ArrowUpRight, RefreshCcw, Package, Sliders, FileDown } from "lucide-react";
import DateRangePicker from "@/components/common/DateRangePicker";
import ExportInventoryTransactionModal from '@/components/modal/ExportInventoryTransactionModal';

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
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const transactionTypeOptions = [
        { value: '', label: 'Semua Tipe Transaksi' },
        { value: 'STOCK_IN', label: 'Barang Masuk (STOCK IN)' },
        { value: 'OUT_BHP', label: 'Keluar BHP (OUT BHP)' },
        { value: 'OUT_ASSET', label: 'Peminjaman Aset (OUT ASSET)' },
        { value: 'RETURN', label: 'Pengembalian (RETURN)' },
        { value: 'ADJUSTMENT', label: 'Penyesuaian Stok (ADJUSTMENT)' },
    ];

    useEffect(() => {
        getData();
    }, [currentPage, perPage, searchTerm, transactionType, startDate, endDate]);

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
            start_date: startDate,
            end_date: endDate
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
            case 'ADJUSTMENT':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"><Sliders className="w-3.5 h-3.5" /> Opname</span>;
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
                let textColor = "";
                let sign = "";
                const absoluteQty = Math.abs(row.qty || 0);

                if (row.transaction_type === 'ADJUSTMENT') {
                    if (row.qty < 0) {
                        textColor = "text-red-600";
                        sign = "-";
                    } else {
                        textColor = "text-green-600";
                        sign = "+";
                    }
                } else if (row.transaction_type.includes('OUT')) {
                    textColor = "text-red-600";
                    sign = "-";
                } else {
                    textColor = "text-green-600";
                    sign = "+";
                }

                return (
                    <span className={`font-bold ${textColor}`}>
                        {sign}{absoluteQty} {row.item?.base_unit?.name}
                    </span>
                );
            },
        },
        {
            id: "user_id",
            header: "Peminjam/Peminta",
            accessorKey: "user_id",
            cell: ({ row }: any) => {
                if (!row.user_id) return <span className="text-gray-400">-</span>;
                return (
                    <span
                        onClick={() => router.push(`/inventories/users/${row.user_id}`)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        title="Lihat detail riwayat karyawan ini"
                    >
                        {`${row.user_id ?? '-'} - ${row.user?.employee?.nama ?? 'N/A'}`}
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

    const handleSummaryDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

        if (dates.startDate) currentParams.set("start_date", dates.startDate);
        else currentParams.delete("start_date");

        if (dates.endDate) currentParams.set("end_date", dates.endDate);
        else currentParams.delete("end_date");

        router.push(`?${currentParams.toString()}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Riwayat Pergerakan Barang</h2>
                        <p className="text-xs text-gray-500">Kelola dan pantau aktivitas transaksi barang</p>
                    </div>
                </div>
                <div className="lg:ml-auto">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FileDown size={18} />
                        <span>Export</span>
                    </button>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Cari NIK atau Nama Barang..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex-1">
                    <Select
                        options={transactionTypeOptions}
                        value={_.find(transactionTypeOptions, { value: transactionType }) || transactionTypeOptions[0]}
                        onValueChange={(opt) => {
                            setTransactionType(opt?.value || "");
                            setCurrentPage(1);
                        }}
                        placeholder="Pilih Tipe Transaksi"
                        isClearable
                    />
                </div>
                <DateRangePicker
                    onDatesChange={handleSummaryDatesChange}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                />



            </div>
            {/* Table */}
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

            <ExportInventoryTransactionModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    );
}