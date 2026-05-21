"use client";

import { useState, useEffect, useRef } from "react";
import {
    Package, ScanBarcode, Camera, X, Loader2, Tags, Layers, Plus, Trash2
} from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
        size: "",
        color: "",
        style: "",
        version: ""
    });

    const [uoms, setUoms] = useState<{ unit_id: string; multiplier: string }[]>([]);

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
                    size: itemData.size || "",
                    color: itemData.color || "",
                    style: itemData.style || "",
                    version: itemData.version || ""
                });

                if (itemData.uoms && Array.isArray(itemData.uoms)) {
                    const mappedUoms = itemData.uoms.map((u: any) => ({
                        unit_id: String(u.unit_id),
                        multiplier: String(u.multiplier)
                    }));
                    setUoms(mappedUoms);
                }

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

    const addUomRow = () => {
        setUoms([...uoms, { unit_id: "", multiplier: "" }]);
    };

    const removeUomRow = (index: number) => {
        const newUoms = [...uoms];
        newUoms.splice(index, 1);
        setUoms(newUoms);
    };

    const handleUomChange = (index: number, field: string, value: string) => {
        const newUoms = [...uoms];
        newUoms[index] = { ...newUoms[index], [field]: value };
        setUoms(newUoms);
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
                fps: 15, 
    
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const dynamicWidth = Math.min(320, viewfinderWidth - 32);
                    return { width: dynamicWidth, height: 160 }; 
                },
    
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                ],
    
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true 
                },
    
                aspectRatio: 1.777778,
    
                videoConstraints: {
                    facingMode: "environment",
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    advanced: [
                        { focusMode: "continuous" } as any,
                        { zoom: 2.0 } as any 
                    ] as any
                },
    
                disableFlip: true,
                rememberLastUsedCamera: true, 
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
                (errorMessage) => console.warn("Scan error:", errorMessage)
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

            const validUoms = uoms
                .filter(uom => uom.unit_id && uom.multiplier)
                .map(uom => ({
                    unit_id: Number(uom.unit_id),
                    multiplier: Number(uom.multiplier)
                }));

            const payloadUpdate = {
                ...formData,
                category_id: Number(formData.category_id),
                base_unit_id: Number(formData.base_unit_id),
                stock_minimum: Number(formData.stock_minimum),
                size: formData.size.trim() !== "" ? formData.size : null,
                color: formData.color.trim() !== "" ? formData.color : null,
                style: formData.style.trim() !== "" ? formData.style : null,
                version: formData.version.trim() !== "" ? formData.version : null,
                uoms: validUoms
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

    const baseUnitLabel = unitOptions.find(u => u.value === formData.base_unit_id)?.label || "Satuan";

    return (
        <ComponentCard title="Edit Informasi Barang">
            <style dangerouslySetInnerHTML={{
                __html: `
                #reader-single { width: 100% !important; border: none !important; }
                #reader-single video { width: 100% !important; height: auto !important; border-radius: 0.5rem !important; object-fit: cover !important; }
                #reader-single__dashboard_section_csr select { max-width: 100% !important; padding: 6px !important; border-radius: 6px !important; border: 1px solid #cbd5e1 !important; font-size: 12px !important; }
                #reader-single__dashboard_section_csr button { background-color: #3b82f6 !important; color: white !important; border: none !important; padding: 6px 12px !important; border-radius: 6px !important; font-size: 12px !important; margin: 4px !important; }
                #reader-single__dashboard_section_swaplink { display: none !important; }
            `}} />
            <form id="edit-item-form" onSubmit={handleSubmit} className="space-y-6 max-w-full overflow-x-hidden">
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                    <Package className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-orange-900">Perhatian: Mode Edit Master Barang</h3>
                        <p className="text-xs text-orange-700 mt-1">Form ini hanya untuk mengubah rincian barang. Untuk mengubah jumlah stok, silakan gunakan menu transaksi.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="col-span-1 md:col-span-2 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <ScanBarcode className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-800">1. Identitas Barang Utama</h3>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="text-sm font-medium text-gray-800 flex items-center justify-between">
                            Barcode / EAN Fisik
                            <span className="text-xs text-gray-500 font-normal">Kosongkan untuk otomatis</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
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
                                type="button" onClick={toggleScanner}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex justify-center items-center gap-2 ${isScannerActive ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                            >
                                {isScannerActive ? <><X className="w-5 h-5" /> Tutup Kamera</> : <><Camera className="w-5 h-5" /> Scan</>}
                            </button>
                        </div>
                        {isScannerActive && <div id="reader-single" className="mt-4 rounded-xl overflow-hidden border-2 border-dashed border-blue-300 max-w-sm mx-auto"></div>}
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-800">Nama Barang Lengkap <span className="text-red-500">*</span></label>
                        <input
                            id="name" type="text" required
                            value={formData.name} onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Contoh: Kopi Kapal Api Mix 25gr"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Kategori <span className="text-red-500">*</span></label>
                        <Select
                            options={categoryOptions}
                            value={_.find(categoryOptions, { value: formData.category_id }) || null}
                            onValueChange={(opt) => handleChange("category_id", opt?.value || "")}
                            placeholder="Pilih kategori..."
                        />
                    </div>

                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Batas Stok Minimum</label>
                        <input
                            type="number" min="0" required
                            value={formData.stock_minimum} onChange={(e) => handleChange("stock_minimum", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Jenis Inventaris <span className="text-red-500">*</span></label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <label className={`flex items-start gap-3 p-3 cursor-pointer rounded-xl border flex-1 transition-all ${formData.item_type === 1 ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" value={1} checked={formData.item_type === 1} onChange={() => handleChange("item_type", 1)} className="w-4 h-4 text-blue-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">BHP (Habis Pakai)</p>
                                    <p className="text-xs text-gray-500 mt-1">Stok berkurang permanen saat diminta user.</p>
                                </div>
                            </label>
                            <label className={`flex items-start gap-3 p-3 cursor-pointer rounded-xl border flex-1 transition-all ${formData.item_type === 2 ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" value={2} checked={formData.item_type === 2} onChange={() => handleChange("item_type", 2)} className="w-4 h-4 text-blue-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Aset / Pinjaman</p>
                                    <p className="text-xs text-gray-500 mt-1">Barang harus dikembalikan setelah dipinjam.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <Tags className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-800">2. Spesifikasi Tambahan (Opsional)</h3>
                    </div>

                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Ukuran / Size</label>
                        <input
                            type="text" value={formData.size} onChange={(e) => handleChange("size", e.target.value)}
                            placeholder="Contoh: 25gr, XL, 30cm"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Warna / Color</label>
                        <input
                            type="text" value={formData.color} onChange={(e) => handleChange("color", e.target.value)}
                            placeholder="Contoh: Hitam, Biru"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Model / Style</label>
                        <input
                            type="text" value={formData.style} onChange={(e) => handleChange("style", e.target.value)}
                            placeholder="Contoh: Lengan Panjang, v2.1"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Versi / Version</label>
                        <input
                            type="text" value={formData.version} onChange={(e) => handleChange("version", e.target.value)}
                            placeholder="Contoh: 2024, v1.0"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-800">3. Konfigurasi Satuan (UOM)</h3>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-800">Satuan Terkecil / Eceran (Wajib) <span className="text-red-500">*</span></label>
                        <div className="w-full sm:w-1/2">
                            <Select
                                options={unitOptions}
                                value={_.find(unitOptions, { value: formData.base_unit_id }) || null}
                                onValueChange={(opt) => handleChange("base_unit_id", opt?.value || "")}
                                placeholder="Pilih satuan (Contoh: Pcs)"
                                prefix={true}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Seluruh perhitungan stok gudang didasarkan pada satuan terkecil ini.</p>
                    </div>

                    <div className="col-span-1 md:col-span-2 p-4 sm:p-5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h4 className="text-sm font-semibold text-blue-900">Satuan Kemasan Tambahan (Opsional)</h4>
                                <p className="text-xs text-blue-700 mt-1">Tambahkan jika barang ini datang dalam bentuk Box, Dus, atau Karton.</p>
                            </div>
                            <button type="button" onClick={addUomRow} disabled={!formData.base_unit_id} className="w-full sm:w-auto justify-center text-sm px-3 py-2 bg-white border border-green-200 text-green-600 rounded-lg hover:bg-green-50 font-medium flex items-center gap-1 disabled:opacity-50 shadow-sm transition-colors">
                                <Plus className="w-4 h-4" /> Tambah Kemasan
                            </button>
                        </div>

                        {uoms.length > 0 && (
                            <div className="space-y-3 mt-4">
                                {uoms.map((uom, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 sm:p-3 rounded-xl border border-gray-200 relative shadow-sm">
                                        <div className="flex justify-between items-center w-full sm:w-auto">
                                            <span className="text-sm font-semibold text-gray-600 sm:w-6">
                                                <span className="sm:hidden">Kemasan </span>{index + 1}
                                            </span>
                                            <button type="button" onClick={() => removeUomRow(index)} className="sm:hidden p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="w-full sm:flex-1">
                                            <Select
                                                options={unitOptions}
                                                value={_.find(unitOptions, { value: uom.unit_id }) || null}
                                                onValueChange={(opt) => handleUomChange(index, "unit_id", opt?.value || "")}
                                                placeholder="Pilih (Misal: Dus)"
                                                prefix={true}
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <span className="text-sm font-semibold text-gray-400 whitespace-nowrap">berisi =</span>
                                            <input
                                                type="number" min="2" placeholder="Isi..."
                                                value={uom.multiplier}
                                                onChange={(e) => handleUomChange(index, "multiplier", e.target.value)}
                                                className="w-full sm:w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
                                            />
                                            <span className="text-sm font-semibold text-gray-600 truncate max-w-[80px] sm:w-16">{baseUnitLabel}</span>
                                        </div>

                                        <button type="button" onClick={() => removeUomRow(index)} className="hidden sm:block p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => router.push("/inventories/items")}
                        type="button"
                        className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="edit-item-form"
                        disabled={loading || isFetchingData}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}