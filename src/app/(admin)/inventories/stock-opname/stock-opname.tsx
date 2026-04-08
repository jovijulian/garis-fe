"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, AlertTriangle, PackageOpen, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

export default function StockOpnamePage() {
    const [loading, setLoading] = useState(false);
    
    // 1. State untuk daftar barang di Dropdown
    const [itemOptions, setItemOptions] = useState<any[]>([]);
    const [rawItems, setRawItems] = useState<any[]>([]); // Menyimpan data asli untuk ditarik stoknya
    
    // 2. State untuk barang yang sedang dipilih
    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [selectedItemData, setSelectedItemData] = useState<any>(null);

    // 3. State untuk Form Input
    const [actualQty, setActualQty] = useState<string>("");
    const [note, setNote] = useState<string>("");

    // Fungsi untuk menarik daftar barang
    const fetchItems = async () => {
        try {
            // Menggunakan API options yang baru kita bahas
            const res = await httpGet(endpointUrl("inventory-items/options"), true);
            const items = res.data?.data || [];
            
            setRawItems(items);
            setItemOptions(items.map((r: any) => ({ 
                value: r.id.toString(), 
                label: `${r.name} ${r.barcode ? `(${r.barcode})` : ''}` 
            })));
        } catch (error) {
            toast.error("Gagal memuat daftar barang.");
        }
    };

    // Tarik daftar barang saat halaman pertama kali dibuka
    useEffect(() => {
        fetchItems();
    }, []);

    // Trigger ketika admin memilih barang di Dropdown
    const handleItemChange = (value: string) => {
        setSelectedItemId(value);
        setActualQty(""); // Reset input angka
        setNote(""); // Reset catatan
        
        if (value) {
            // Cari data lengkap barang tersebut dari state rawItems
            const itemDetail = rawItems.find(item => item.id.toString() === value);
            setSelectedItemData(itemDetail);
        } else {
            setSelectedItemData(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedItemId || actualQty === "" || !note) {
            toast.warning("Mohon lengkapi barang, stok fisik, dan catatan.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                item_id: Number(selectedItemId),
                actual_qty: Number(actualQty),
                note: note
            };

            const res = await httpPost(endpointUrl("inventory-transactions/adjustment"), payload, true);
            toast.success(res.data?.message || "Stok berhasil disesuaikan!");
            
            // Bersihkan form setelah sukses
            setSelectedItemId("");
            setSelectedItemData(null);
            setActualQty("");
            setNote("");

            // Refresh daftar item agar stok terbaru langsung ter-update di dropdown
            fetchItems(); 

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal melakukan penyesuaian stok.");
        } finally {
            setLoading(false);
        }
    };

    // Kalkulasi selisih untuk UI
    const difference = selectedItemData && actualQty !== "" ? Number(actualQty) - selectedItemData.stock_available : 0;
    const isSame = selectedItemData && actualQty !== "" && Number(actualQty) === selectedItemData.stock_available;

    return (
        <ComponentCard title="Penyesuaian Stok (Stock Opname)">
            <form onSubmit={handleSubmit} className="space-y-8 max-w-full">
                
                {/* Bagian Penjelasan */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p>
                        Gunakan halaman ini jika terdapat perbedaan antara jumlah barang di rak fisik dengan jumlah di sistem. 
                        Sistem akan otomatis mencatat selisihnya ke dalam riwayat transaksi sebagai <b>ADJUSTMENT</b>.
                    </p>
                </div>

                {/* STEP 1: PILIH BARANG */}
                <div className="space-y-3">
                    <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                        Pilih Barang yang Akan Disesuaikan
                    </label>
                    <div className="pl-8">
                        <Select
                            // KITA GUNAKAN isSearchable={true} yang sudah ditambahkan di komponen Select Bapak
                            // isSearchable={true} 
                            options={itemOptions}
                            value={_.find(itemOptions, { value: selectedItemId }) || null}
                            onValueChange={(opt) => handleItemChange(opt?.value || "")}
                            placeholder="Ketik nama atau scan barcode barang..."
                        />
                    </div>
                </div>

                {/* STEP 2: TAMPILKAN INFO STOK SISTEM (Muncul jika barang dipilih) */}
                {selectedItemData && (
                    <div className="pl-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white shadow-sm text-blue-600 rounded-lg">
                                    <PackageOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Stok di Sistem Saat Ini</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-blue-900">
                                            {selectedItemData.stock_available}
                                        </span>
                                        <span className="text-sm font-bold text-blue-700">
                                            {selectedItemData.base_unit?.name || 'Unit'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: INPUT STOK FISIK & CATATAN (Muncul jika barang dipilih) */}
                {selectedItemData && (
                    <div className="space-y-6 pt-6 border-t border-gray-100 animate-in fade-in duration-500">
                        <div className="space-y-3">
                            <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                                Masukkan Stok Fisik Aktual
                            </label>
                            <div className="pl-8">
                                <input
                                    type="number" min="0" required
                                    value={actualQty}
                                    onChange={(e) => setActualQty(e.target.value)}
                                    placeholder="Contoh: 8 (Berapa jumlah aslinya di rak saat ini?)"
                                    className={`w-full px-4 py-3 text-lg border rounded-xl outline-none transition-all focus:ring-4 ${isSame ? 'border-green-300 focus:ring-green-100 bg-green-50' : difference !== 0 && actualQty !== "" ? 'border-orange-300 focus:ring-orange-100 bg-orange-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-400'}`}
                                />
                                
                                {/* Info Status Kalkulasi Otomatis */}
                                {actualQty !== "" && isSame && (
                                    <p className="text-sm text-green-600 flex items-center gap-1.5 mt-2 font-medium">
                                        <Check className="w-4 h-4"/> Stok fisik sesuai dengan sistem. Tidak ada yang perlu disesuaikan.
                                    </p>
                                )}
                                {actualQty !== "" && !isSame && (
                                    <p className="text-sm text-orange-600 flex items-center gap-1.5 mt-2 font-medium">
                                        <AlertTriangle className="w-4 h-4"/> 
                                        Sistem akan mencatat <b>{difference > 0 ? `Penambahan +${difference}` : `Pengurangan ${difference}`}</b> {selectedItemData.base_unit?.name}.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
                                Alasan / Catatan Penyesuaian
                            </label>
                            <div className="pl-8 relative">
                                <FileText className="absolute left-11 top-3.5 w-5 h-5 text-gray-400" />
                                <textarea
                                    required rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Contoh: 2 barang rusak karena basah / 1 barang hilang tidak terlapor"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading || isSame || actualQty === ""}
                                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Konfirmasi Penyesuaian Stok
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </ComponentCard>
    );
}