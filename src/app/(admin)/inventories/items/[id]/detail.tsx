"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Table from "@/components/tables/Table";
import {
    Package, ScanBarcode, Layers, AlertTriangle, ArrowDownRight, ArrowUpRight, RefreshCcw, Sliders
} from "lucide-react";

export default function ItemDetailPage() {
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');

    const [itemData, setItemData] = useState<any>(null);
    const [isItemLoading, setIsItemLoading] = useState(true);

    const [logs, setLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [lastPage, setLastPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const getItemDetail = useCallback(async () => {
        if (!id) return;
        setIsItemLoading(true);
        try {
            const response = await httpGet(endpointUrl(`inventory-items/${id}`), true);
            setItemData(response.data.data || response.data);
        } catch (error) {
            toast.error("Gagal mengambil detail barang.");
        } finally {
            setIsItemLoading(false);
        }
    }, [id]);

    const getTransactionHistory = useCallback(async () => {
        if (!id) return;
        setIsLoadingLogs(true);
        try {
            const params = {
                item_id: id,
                page: currentPage,
                per_page: perPage
            };
            const response = await httpGet(endpointUrl("inventory-transactions"), true, params);
            setLogs(response.data.data.data);
            setTotalLogs(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat riwayat transaksi.");
        } finally {
            setIsLoadingLogs(false);
        }
    }, [id, currentPage, perPage]);

    useEffect(() => {
        getItemDetail();
    }, [getItemDetail]);

    useEffect(() => {
        getTransactionHistory();
    }, [getTransactionHistory]);


    // const getTransactionBadge = (type: string) => {
    //     switch (type) {
    //         case 'STOCK_IN': return <span className="text-green-600 font-bold flex items-center gap-1"><ArrowDownRight size={14}/> Masuk</span>;
    //         case 'OUT_BHP': return <span className="text-purple-600 font-bold flex items-center gap-1"><ArrowUpRight size={14}/> Keluar BHP</span>;
    //         case 'OUT_ASSET': return <span className="text-orange-600 font-bold flex items-center gap-1"><ArrowUpRight size={14}/> Dipinjam</span>;
    //         case 'RETURN': return <span className="text-blue-600 font-bold flex items-center gap-1"><RefreshCcw size={14}/> Dikembalikan</span>;
    //         default: return <span>{type}</span>;
    //     }
    // };
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

    const logColumns = useMemo(() => [
        {
            id: "created_at",
            header: "Tgl Transaksi",
            accessorKey: "created_at",
            cell: ({ row }: any) => <span>{moment(row.created_at).format("DD MMM YYYY, HH:mm")}</span>,
        },
        {
            id: "transaction_type",
            header: "Jenis",
            accessorKey: "transaction_type",
            cell: ({ row }: any) => getTransactionBadge(row.transaction_type),
        },
        {
            id: "qty",
            header: "Perubahan Qty",
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
            id: "nik",
            header: "Pihak Terkait (NIK)",
            accessorKey: "nik",
            cell: ({ row }: any) => <span className="font-medium text-gray-800">{row.nik || "-"}</span>,
        },
        {
            id: "note",
            header: "Keterangan",
            accessorKey: "note",
            cell: ({ row }: any) => <span className="text-sm text-gray-600">{row.note || "-"}</span>,
        },
        {
            id: "created_by",
            header: "Dibuat Oleh",
            accessorKey: "created_by",
            cell: ({ row }: any) => <span className="text-xs text-gray-500">{row.created_by_user?.nama_user || row.created_by}</span>,
        },
    ], []);

    if (isItemLoading) return <p className="text-center mt-10 text-gray-500">Memuat detail barang...</p>;
    if (!itemData) return <p className="text-center mt-10 text-red-500">Barang tidak ditemukan.</p>;

    const isLowStock = itemData.stock_available <= itemData.stock_minimum;

    return (
        <ComponentCard title="Kartu Stok & Detail Barang">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-800">{itemData.name}</h1>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${itemData.item_type === 1 ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {itemData.item_type === 1 ? 'BHP' : 'ASET / PINJAMAN'}
                        </span>
                    </div>
                    <p className="text-gray-500 flex items-center gap-2">
                        <ScanBarcode className="w-4 h-4" /> Barcode: <strong>{itemData.barcode || 'Tidak ada barcode'}</strong>
                    </p>
                </div>

                <div className={`flex flex-col items-end px-6 py-4 rounded-2xl border-2 ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <span className={`text-sm font-bold ${isLowStock ? 'text-red-500' : 'text-blue-600'}`}>SISA STOK GUDANG</span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${isLowStock ? 'text-red-700' : 'text-blue-900'}`}>
                            {itemData.stock_available}
                        </span>
                        <span className="text-lg font-bold text-gray-600">{itemData.base_unit?.name}</span>
                    </div>
                    {isLowStock && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Stok menipis!</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <DetailItem icon={<Layers />} label="Kategori" value={itemData.category?.name} />
                <DetailItem icon={<Package />} label="Satuan Terkecil" value={itemData.base_unit?.name} />
                <DetailItem icon={<Package />} label="Kemasan Box" value={itemData.pack_unit ? `1 ${itemData.pack_unit.name} = ${itemData.qty_per_pack} ${itemData.base_unit?.name}` : 'Tidak ada'} />
                <DetailItem icon={<AlertTriangle />} label="Batas Stok Minimum" value={`${itemData.stock_minimum} ${itemData.base_unit?.name}`} />
            </div>

            <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <RefreshCcw className="text-gray-400 w-5 h-5" /> Riwayat Pergerakan Barang (Kartu Stok)
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <Table
                        data={logs}
                        columns={logColumns}
                        pagination={true}
                        lastPage={lastPage}
                        total={totalLogs}
                        loading={isLoadingLogs}
                        onPageChange={setCurrentPage}
                        onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
                    />
                </div>
            </div>

        </ComponentCard>
    );
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-start gap-4">
        <div className="text-blue-500 mt-1 bg-blue-50 p-2 rounded-lg">{icon}</div>
        <div>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-bold text-sm text-gray-800">{value || '-'}</span>
        </div>
    </div>
);