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
    User, History, Package, ArrowDownRight, ArrowUpRight, RefreshCcw, Box, FileText, AlertTriangle, CheckCircle2, Sliders
} from "lucide-react";

export default function UserDetailPage() {
    const params = useParams();
    const nik = decodeURIComponent(String(params.nik)); 
    moment.locale('id');
    const router = useRouter();
    const [loans, setLoans] = useState<any[]>([]);
    const [isLoadingLoans, setIsLoadingLoans] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [lastPage, setLastPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [summary, setSummary] = useState({ totalBHP: 0, totalAset: 0 });

    const getUserLoans = useCallback(async () => {
    if (!nik) return;
    setIsLoadingLoans(true);
    try {
        const response = await httpGet(endpointUrl(`inventory-loans/by-nik/?nik=${nik}`), true);
        setLoans(response.data?.data || []);
    } catch (error) {
        console.error("Gagal memuat data pinjaman user");
    } finally {
        setIsLoadingLoans(false);
    }
}, [nik]);


    const getUserTransactionHistory = useCallback(async () => {
        if (!nik) return;
        setIsLoadingLogs(true);
        try {
            const queryParams = {
                nik: nik,
                page: currentPage,
                per_page: perPage
            };
            const response = await httpGet(endpointUrl("inventory-transactions"), true, queryParams);
            const responseData = response.data.data.data;
            
            setLogs(responseData);
            setTotalLogs(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
            let countBHP = 0;
            let countAset = 0;
            responseData.forEach((log: any) => {
                if (log.transaction_type === 'OUT_BHP') countBHP += log.qty;
                if (log.transaction_type === 'OUT_ASSET') countAset += log.qty;
            });
            setSummary({ totalBHP: countBHP, totalAset: countAset });

        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat riwayat transaksi karyawan.");
        } finally {
            setIsLoadingLogs(false);
        }
    }, [nik, currentPage, perPage]);

    useEffect(() => {
        getUserTransactionHistory();
        getUserLoans();
    }, [getUserTransactionHistory, getUserLoans]);


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
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{moment(row.created_at).format("DD MMM YYYY")}</span>
                    <span className="text-xs text-gray-500">{moment(row.created_at).format("HH:mm")}</span>
                </div>
            ),
        },
        {
            id: "transaction_type",
            header: "Jenis Aktivitas",
            accessorKey: "transaction_type",
            cell: ({ row }: any) => getTransactionBadge(row.transaction_type),
        },
        {
            id: "item_name",
            header: "Barang",
            accessorKey: "item.name",
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span 
                        className="font-semibold text-blue-600 hover:underline cursor-pointer" 
                        onClick={() => router.push(`/inventories/items/${row.item_id}`)}
                    >
                        {row.item?.name || "-"}
                    </span>
                    <span className="text-xs text-gray-500">{row.item?.barcode || ""}</span>
                </div>
            ),
        },
        {
            id: "qty",
            header: "Jumlah",
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
            id: "note",
            header: "Catatan",
            accessorKey: "note",
            cell: ({ row }: any) => <span className="text-sm text-gray-600">{row.note || "-"}</span>,
        },
        {
            id: "created_by",
            header: "Dilayani Oleh",
            accessorKey: "created_by",
            cell: ({ row }: any) => <span className="text-xs text-gray-500">{row.created_by_user?.nama_user || row.created_by}</span>,
        },
    ], [router]);

    const activeLoans = loans.filter(l => l.status === 'BORROWED' || l.status === 'PARTIAL_RETURNED');
    const completedLoans = loans.filter(l => l.status === 'RETURNED');

    return (
        <ComponentCard title="Profil & Riwayat Karyawan">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-md">
                    <User size={40} />
                </div>
                <div className="text-center md:text-left flex-grow">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Identitas Karyawan</h2>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">NIK: {nik}</h1>
                    <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                        <FileText className="w-4 h-4" /> 
                        Seluruh riwayat pengambilan ATK dan peminjaman inventaris dicatat di bawah ini.
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-purple-50 border border-purple-100 px-5 py-3 rounded-2xl text-center">
                        <span className="text-xs font-bold text-purple-600 uppercase">Total BHP Diminta</span>
                        <div className="text-2xl font-black text-purple-900">{summary.totalBHP}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 px-5 py-3 rounded-2xl text-center">
                        <span className="text-xs font-bold text-orange-600 uppercase">Total Aset Dipinjam</span>
                        <div className="text-2xl font-black text-orange-900">{summary.totalAset}</div>
                    </div>
                </div>
            </div>

            {activeLoans.length > 0 && (
                <div className="mb-10 bg-orange-50/50 border-2 border-orange-200 p-6 rounded-2xl animate-in fade-in duration-500">
                    <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500 w-5 h-5"/> 
                        Tanggungan Aset Karyawan (Belum Lunas)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeLoans.map((loan) => (
                            <div key={loan.id} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${loan.status === 'PARTIAL_RETURNED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {loan.status === 'PARTIAL_RETURNED' ? 'KEMBALI SEBAGIAN' : 'DIPINJAM'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            Sejak {moment(loan.borrowed_at).format("DD MMM YYYY")}
                                        </span>
                                    </div>
                                    <h5 className="font-bold text-gray-800 leading-tight mb-1">{loan.item?.name}</h5>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-orange-100 flex justify-between items-center">
                                    <div className="text-xs text-gray-500 flex flex-col">
                                        <span>Total Pinjam: <b>{loan.qty_borrowed}</b></span>
                                        <span>Dikembalikan: <b className="text-green-600">{loan.qty_returned}</b></span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-orange-400 block mb-0.5">SISA TANGGUNGAN</span>
                                        <span className="text-2xl font-black text-orange-600">
                                            {loan.qty_borrowed - loan.qty_returned}
                                        </span>
                                        <span className="text-xs font-bold text-orange-800 ml-1">
                                            {loan.item?.base_unit?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Jika tidak ada tanggungan, tampilkan pesan aman */}
            {!isLoadingLoans && activeLoans.length === 0 && (
                <div className="mb-10 bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="text-green-500 w-6 h-6" />
                    <p className="text-sm font-medium text-green-800">
                        Karyawan ini <b>Bebas Tanggungan</b>. Tidak ada aset perusahaan yang sedang dipinjam atau belum dikembalikan.
                    </p>
                </div>
            )}
            {/* 2. Tabel Riwayat Mutasi (Kartu Stok User) */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <History className="text-gray-400 w-5 h-5"/> Riwayat Transaksi 
                    </h4>
                </div>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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