"use client";

import { useState, useEffect, useRef } from "react";
import {
    Package, ScanBarcode, Camera, X, Loader2
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { endpointUrl, httpPost, httpGet, httpPut } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

export default function EditInventoryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [loading, setLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);

    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [unitOptions, setUnitOptions] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        cab_id: 0,
        item_type: 1,
        name: "",
        barcode: "",
        category_id: "",
        base_unit_id: "",
        stock_minimum: 0,
    });

    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setIsFetchingData(true);
            try {
                const [unitRes, categoryRes, itemRes] = await Promise.all([
                    httpGet(endpointUrl("/inventory-units/options"), true),
                    httpGet(endpointUrl("/inventory-categories/options"), true),
                    httpGet(endpointUrl(`/inventory-items/${id}`), true)
                ]);

                setUnitOptions(unitRes.data.data.map((r: any) => ({ value: r.id.toString(), label: r.name })));
                setCategoryOptions(categoryRes.data.data.map((r: any) => ({ value: r.id.toString(), label: r.name })));

                const itemData = itemRes.data.data || itemRes.data;
                setFormData({
                    cab_id: itemData.cab_id,
                    item_type: itemData.item_type,
                    name: itemData.name,
                    barcode: itemData.barcode || "",
                    category_id: String(itemData.category_id),
                    base_unit_id: String(itemData.base_unit_id),
                    stock_minimum: itemData.stock_minimum,
                });

            } catch (error) {
                console.error("Gagal mengambil data:", error);
                toast.error("Gagal memuat data barang.");
                router.push('/inventories/items');
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchData();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
            }
        };
    }, [id, router]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleScanner = () => {
        if (isScannerActive) {
            setIsScannerActive(false);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear().then(() => {
                    setIsScannerActive(true);
                    startScanner();
                }).catch(e => console.error(e));
            } else {
                setIsScannerActive(true);
                startScanner();
            }
        }
    };

    const startScanner = () => {
        setTimeout(() => {
            const config = {
                fps: 20, 
                
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const dynamicWidth = Math.min(300, viewfinderWidth - 40);
                    return { width: dynamicWidth, height: 120 };
                },
                
                aspectRatio: 1.777778,
                videoConstraints: {
                    facingMode: "environment",
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    advanced: [
                        { focusMode: "continuous" } as any,
                        { zoom: 2.0 } as any 
                    ] 
                },
                
                disableFlip: true,
            };
            const newScanner = new Html5QrcodeScanner(`reader-single`, config, false);
            scannerRef.current = newScanner;

            newScanner.render(
                (decodedText) => {
                    handleChange("barcode", decodedText);
                    setIsScannerActive(false);
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(e => console.error(e));
                        scannerRef.current = null;
                    }
                    toast.success("Barcode berhasil di-scan!");
                },
                (errorMessage) => { /* Silently ignore frame errors */ }
            );
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.category_id || !formData.base_unit_id) {
                toast.warning("Mohon lengkapi Nama, Kategori, dan Satuan Dasar");
                setLoading(false); return;
            }

            const payloadUpdate = {
                ...formData,
                category_id: Number(formData.category_id),
                base_unit_id: Number(formData.base_unit_id),
                stock_minimum: Number(formData.stock_minimum),
            };

            await httpPut(endpointUrl(`/inventory-items/${id}`), payloadUpdate, true);

            toast.success("Informasi barang berhasil diperbarui!");
            router.push('/inventories/items');

        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal memperbarui data");
        } finally {
            setLoading(false);
        }
    };

    if (isFetchingData) {
        return (
            <ComponentCard title="Edit Barang">
                <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Memuat data barang...</p>
                </div>
            </ComponentCard>
        );
    }

    return (
        <ComponentCard title="Edit Informasi Barang">
            <form id="edit-item-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                    <Package className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-orange-900">Perhatian: Mode Edit Master Barang</h3>
                        <p className="text-xs text-orange-700 mt-1">Form ini hanya untuk mengubah rincian barang. Untuk mengubah jumlah stok, silakan gunakan menu transaksi</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="text-sm font-medium text-gray-800 flex items-center justify-between">
                            Barcode / EAN
                            <span className="text-xs text-gray-500 font-normal">Kosongkan jika ingin generate otomatis</span>
                        </label>

                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => handleChange("barcode", e.target.value)}
                                    placeholder="Scan atau ketik barcode"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm outline-none transition-all"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={toggleScanner}
                                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${isScannerActive
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                                    }`}
                            >
                                {isScannerActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                <span className="hidden sm:inline">{isScannerActive ? "Tutup Kamera" : "Scan Kamera"}</span>
                            </button>
                        </div>

                        {isScannerActive && (
                            <div className="mt-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl relative flex flex-col items-center">
                                <div id="reader-single" className="w-full rounded-lg overflow-hidden max-w-sm"></div>
                                <p className="text-xs text-blue-600 mt-3 font-medium">Arahkan kamera ke barcode kemasan barang</p>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-800">Nama Barang <span className="text-red-500">*</span></label>
                        <input
                            id="name" type="text" required
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Contoh: Pulpen Faster Hitam"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>

                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Kategori <span className="text-red-500">*</span></label>
                        <Select
                            options={categoryOptions}
                            value={_.find(categoryOptions, { value: formData.category_id })}
                            onValueChange={(opt) => handleChange("category_id", opt.value)}
                            placeholder="Pilih kategori..."
                            disabled={false}
                        />
                    </div>

                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Satuan <span className="text-red-500">*</span></label>
                        <Select
                            options={unitOptions}
                            value={_.find(unitOptions, { value: formData.base_unit_id })}
                            onValueChange={(opt) => handleChange("base_unit_id", opt.value)}
                            placeholder="Pilih unit / satuan..."
                            disabled={false}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="text-sm font-medium text-gray-800">Jenis Inventaris <span className="text-red-500">*</span></label>
                        <div className="flex gap-4">
                            <label className={`flex items-center gap-2 p-3 cursor-pointer rounded-xl border transition-all flex-1 ${formData.item_type === 1 ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio" value={1}
                                    checked={formData.item_type === 1}
                                    onChange={() => handleChange("item_type", 1)}
                                    className="w-4 h-4 text-blue-600 border-gray-300"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">BHP (Habis Pakai)</p>
                                    <p className="text-xs text-gray-500 mt-1">Stok berkurang permanen saat diminta user.</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-2 p-3 cursor-pointer rounded-xl border transition-all flex-1 ${formData.item_type === 2 ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio" value={2}
                                    checked={formData.item_type === 2}
                                    onChange={() => handleChange("item_type", 2)}
                                    className="w-4 h-4 text-blue-600 border-gray-300"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Aset / Pinjaman</p>
                                    <p className="text-xs text-gray-500 mt-1">Barang harus dikembalikan setelah dipinjam.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Batas Stok Minimum</label>
                        <input
                            type="number" min="0" required
                            value={formData.stock_minimum}
                            onChange={(e) => handleChange("stock_minimum", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 ">

                    <button
                        onClick={() => router.push("/inventories/items")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-item-form"
                        disabled={loading || isFetchingData}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>

            </form>
        </ComponentCard>
    );
}