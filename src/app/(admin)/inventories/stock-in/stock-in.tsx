"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    Check, Package, ScanBarcode, Camera, X, Loader2, Info, PackagePlus
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { endpointUrl, httpPost, httpGet } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

export default function StockInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [unitOptions, setUnitOptions] = useState<any[]>([]);

    const [existingItemData, setExistingItemData] = useState<any>(null);

    const [formData, setFormData] = useState({
        cab_id: 0,
        item_type: 1,
        name: "",
        barcode: "",
        category_id: "",
        base_unit_id: "",
        pack_unit_id: "",
        qty_per_pack: "",
        stock_minimum: 0,
        initial_qty: "",
        input_unit_id: "",
    });

    const [isExistingItem, setIsExistingItem] = useState(false);
    const [existingItemId, setExistingItemId] = useState<number | null>(null);

    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [unitRes, categoryRes] = await Promise.all([
                    httpGet(endpointUrl("/inventory-units/options"), true),
                    httpGet(endpointUrl("/inventory-categories/options"), true),
                ]);
                setUnitOptions(unitRes.data.data.map((r: any) => ({ value: r.id.toString(), label: r.name })));
                setCategoryOptions(categoryRes.data.data.map((r: any) => ({ value: r.id.toString(), label: r.name })));
            } catch (error) {
                console.error("Gagal mengambil master data:", error);
            }
        };

        fetchOptions();
        const cabId = localStorage.getItem("sites");
        setFormData(prev => ({ ...prev, cab_id: cabId ? Number(cabId) : 0 }));
        return () => {
            if (scannerRef.current) scannerRef.current.clear().catch(e => console.error(e));
        };
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const inputUnitOptions = useMemo(() => {
        const options = [];
        if (formData.base_unit_id) {
            const baseOpt = unitOptions.find(u => u.value === String(formData.base_unit_id));
            if (baseOpt) options.push({ value: baseOpt.value, label: baseOpt.label });
        }
        if (formData.pack_unit_id && formData.qty_per_pack) {
            const packOpt = unitOptions.find(u => u.value === String(formData.pack_unit_id));
            if (packOpt) options.push({ value: packOpt.value, label: `${packOpt.label} (1 = ${formData.qty_per_pack})` });
        }
        return options;
    }, [formData.base_unit_id, formData.pack_unit_id, formData.qty_per_pack, unitOptions]);

    useEffect(() => {
        if (formData.base_unit_id && !formData.input_unit_id) {
            handleChange("input_unit_id", formData.base_unit_id);
        }
    }, [formData.base_unit_id]);

    const qtyPreview = useMemo(() => {
        if (!formData.initial_qty || !formData.input_unit_id) return null;

        const qty = Number(formData.initial_qty);
        if (qty <= 0) return null;

        if (formData.input_unit_id === formData.pack_unit_id && formData.qty_per_pack) {
            const total = qty * Number(formData.qty_per_pack);
            const packLabel = unitOptions.find(u => u.value === String(formData.pack_unit_id))?.label;
            const baseLabel = unitOptions.find(u => u.value === String(formData.base_unit_id))?.label;
            return `${qty} ${packLabel} × ${formData.qty_per_pack} = ${total} ${baseLabel}`;
        }

        return null;
    }, [formData.initial_qty, formData.input_unit_id, formData.pack_unit_id, formData.qty_per_pack, formData.base_unit_id, unitOptions]);


    const handleCheckBarcode = async (scannedBarcode: string) => {
        if (isCheckingBarcode) return;

        if (isScannerActive || scannerRef.current) {
            setIsScannerActive(false);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
        }

        if (!scannedBarcode || scannedBarcode.trim() === "") {
            setIsExistingItem(false);
            setExistingItemId(null);
            setExistingItemData(null);
            setFormData(prev => ({ ...prev, name: "", category_id: "", base_unit_id: "", pack_unit_id: "", qty_per_pack: "", stock_minimum: 0, initial_qty: "", input_unit_id: "" }));
            return;
        }

        setIsCheckingBarcode(true);
        try {
            const res = await httpGet(endpointUrl(`/inventory-items/check-barcode/${scannedBarcode}?cab_id=${formData.cab_id}`), true);
            const result = res.data?.data;

            if (result?.is_existing) {
                const item = result.data;
                setIsExistingItem(true);
                setExistingItemId(item.id);
                setExistingItemData(item);

                setFormData(prev => ({
                    ...prev,
                    barcode: scannedBarcode,
                    name: item.name,
                    category_id: String(item.category_id),
                    base_unit_id: String(item.base_unit_id),
                    pack_unit_id: item.pack_unit_id ? String(item.pack_unit_id) : "",
                    qty_per_pack: item.qty_per_pack || "",
                    item_type: item.item_type,
                    stock_minimum: item.stock_minimum,
                    initial_qty: "1",
                    input_unit_id: item.pack_unit_id ? String(item.pack_unit_id) : String(item.base_unit_id),
                }));

                document.getElementById("initial_qty")?.focus();
                toast.success("Barang sudah terdaftar. Silakan masukkan jumlah stok.");
            } else {
                setIsExistingItem(false);
                setExistingItemId(null);
                setExistingItemData(null);
                setFormData(prev => ({ ...prev, barcode: scannedBarcode, input_unit_id: "" }));
                document.getElementById("name")?.focus();
                toast.success("Barang baru terdeteksi. Silakan lengkapi informasi barang.");
            }
        } catch (error) {
            console.error("Error checking barcode:", error);
            setIsExistingItem(false);
            toast.error("Gagal memeriksa barcode.");
        } finally {
            setIsCheckingBarcode(false);
        }
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
                fps: 10,
                qrbox: { width: 220, height: 120 },
                aspectRatio: 1.777778,

                videoConstraints: {
                    facingMode: "environment",
                    advanced: [{ focusMode: "continuous" } as any]
                },

                disableFlip: false,
            };
            const newScanner = new Html5QrcodeScanner(`reader-single`, config, false);
            scannerRef.current = newScanner;

            newScanner.render(
                (decodedText) => {
                    handleChange("barcode", decodedText);
                    handleCheckBarcode(decodedText);
                },
                (errorMessage) => console.warn("Scan error:", errorMessage)
            );
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isExistingItem && existingItemId) {
                if (!formData.initial_qty || Number(formData.initial_qty) <= 0) {
                    toast.warning("Masukkan jumlah stok yang valid untuk ditambahkan.");
                    setLoading(false); return;
                }
                if (!formData.input_unit_id) {
                    toast.warning("Pilih satuan barang yang masuk.");
                    setLoading(false); return;
                }

                const payloadStockIn = {
                    item_id: existingItemId,
                    input_qty: Number(formData.initial_qty),
                    input_unit_id: Number(formData.input_unit_id),
                    note: "Penambahan stok masuk"
                };

                await httpPost(endpointUrl("/inventory-transactions/stock-in"), payloadStockIn, true);
                toast.success("Stok barang berhasil ditambahkan!");

            } else {
                if (!formData.name || !formData.category_id || !formData.base_unit_id) {
                    toast.warning("Mohon lengkapi Nama, Kategori, dan Satuan Dasar");
                    setLoading(false); return;
                }

                const payloadCreate = {
                    ...formData,
                    category_id: Number(formData.category_id),
                    base_unit_id: Number(formData.base_unit_id),
                    pack_unit_id: formData.pack_unit_id ? Number(formData.pack_unit_id) : null,
                    qty_per_pack: formData.qty_per_pack ? Number(formData.qty_per_pack) : null,
                    stock_minimum: Number(formData.stock_minimum),
                    initial_qty: formData.initial_qty ? Number(formData.initial_qty) : 0,
                    initial_unit_id: formData.input_unit_id ? Number(formData.input_unit_id) : Number(formData.base_unit_id)
                };
                delete (payloadCreate as any).input_unit_id;
                await httpPost(endpointUrl("/inventory-items"), payloadCreate, true);
                toast.success("Barang baru beserta stok awalnya berhasil didaftarkan!");
            }

            setFormData({ cab_id: 1, item_type: 1, name: "", barcode: "", category_id: "", base_unit_id: "", pack_unit_id: "", qty_per_pack: "", stock_minimum: 0, initial_qty: "", input_unit_id: "" });
            setIsExistingItem(false);
            setExistingItemId(null);
            setExistingItemData(null);

        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal memproses data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Penerimaan Barang (Stock In)">
            <form id="single-item-form" onSubmit={handleSubmit} className="space-y-6">
                {isExistingItem && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-900">Barang Sudah Terdaftar</h3>
                            <p className="text-xs text-blue-700 mt-1">Sistem mengenali barcode ini. Silakan langsung ke bagian bawah untuk mengisi jumlah barang yang baru datang.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-800 flex items-center justify-between">
                            1. Scan Barcode / EAN
                            <span className="text-xs text-gray-500 font-normal">Kosongkan untuk generate otomatis</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => handleChange("barcode", e.target.value)}
                                    onBlur={(e) => handleCheckBarcode(e.target.value)}
                                    placeholder="Scan atau ketik barcode lalu tekan Tab/Enter"
                                    className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm outline-none transition-all bg-gray-50 focus:bg-white"
                                />
                                {isCheckingBarcode && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
                            </div>
                            <button
                                type="button" onClick={toggleScanner}
                                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${isScannerActive ? "bg-red-50 text-red-600 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"}`}
                            >
                                {isScannerActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                <span className="hidden sm:inline">{isScannerActive ? "Tutup Kamera" : "Scan Kamera"}</span>
                            </button>
                        </div>
                        {isScannerActive && (
                            <div className="mt-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl relative flex flex-col items-center">
                                <div id="reader-single" className="w-full rounded-lg overflow-hidden max-w-sm"></div>
                            </div>
                        )}
                    </div>

                    {!isExistingItem && (
                        <>
                            <div className="col-span-1 md:col-span-2 mt-4 mb-2 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <PackagePlus className="w-5 h-5 text-gray-400" />
                                <h3 className="font-semibold text-gray-800">2. Pendaftaran Master Barang Baru</h3>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-gray-800">Nama Barang <span className="text-red-500">*</span></label>
                                <input
                                    id="name" type="text" required
                                    value={formData.name} onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Contoh: Kertas HVS Sinar Dunia A4 70gsm"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
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
                                <label className="text-sm font-medium text-gray-800">Jenis Inventaris <span className="text-red-500">*</span></label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 p-3 cursor-pointer rounded-xl border flex-1 ${formData.item_type === 1 ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}>
                                        <input type="radio" value={1} checked={formData.item_type === 1} onChange={() => handleChange("item_type", 1)} className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-gray-900 text-sm">BHP (Habis Pakai)</span>
                                    </label>
                                    <label className={`flex items-center gap-2 p-3 cursor-pointer rounded-xl border flex-1 ${formData.item_type === 2 ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}>
                                        <input type="radio" value={2} checked={formData.item_type === 2} onChange={() => handleChange("item_type", 2)} className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-gray-900 text-sm">Pinjaman / Aset</span>
                                    </label>
                                </div>
                            </div>

                            {/* DEFINISI SATUAN TERKECIL */}
                            <div className="col-span-1 space-y-2">
                                <label className="text-sm font-medium text-gray-800">Satuan Terkecil / Eceran <span className="text-red-500">*</span></label>
                                <Select
                                    options={unitOptions}
                                    value={_.find(unitOptions, { value: formData.base_unit_id }) || null}
                                    onValueChange={(opt) => handleChange("base_unit_id", opt?.value || "")}
                                    placeholder="Contoh: PCS / RIM"
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

                            <div className="col-span-1 md:col-span-2 p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                                <h4 className="text-sm font-semibold text-gray-800">Definisi Kemasan Besar (Opsional, isi jika barang punya kemasan Box/Dus)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Pilih Satuan Kemasan</label>
                                        <Select
                                            options={unitOptions}
                                            value={_.find(unitOptions, { value: formData.pack_unit_id }) || null}
                                            onValueChange={(opt) => handleChange("pack_unit_id", opt?.value || "")}
                                            placeholder="Contoh: BOX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">
                                            Isi per {unitOptions.find(u => u.value === formData.pack_unit_id)?.label || 'Kemasan'}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min="1" disabled={!formData.pack_unit_id}
                                                value={formData.qty_per_pack}
                                                onChange={(e) => handleChange("qty_per_pack", e.target.value)}
                                                placeholder="Contoh: 12"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-200"
                                            />
                                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                                                {unitOptions.find(u => u.value === formData.base_unit_id)?.label || 'Satuan Eceran'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                        <label htmlFor="initial_qty" className={`text-base block mb-3 ${isExistingItem ? 'text-blue-700 font-bold' : 'text-gray-800 font-semibold'}`}>
                            {isExistingItem ? "3. Berapa Jumlah Barang yang Datang?" : "3. Stok Awal (Opsional)"}
                            {isExistingItem && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        <div className="flex gap-3 items-stretch">
                            <div className="relative flex-1">
                                <input
                                    id="initial_qty" type="number" min={isExistingItem ? "1" : "0"} required={isExistingItem}
                                    value={formData.initial_qty}
                                    onChange={(e) => handleChange("initial_qty", e.target.value)}
                                    placeholder="0"
                                    className={`w-full h-full px-4 py-3 border rounded-xl text-lg pl-12 outline-none focus:ring-2 focus:ring-blue-100 ${isExistingItem ? 'border-blue-400 bg-blue-50/20 font-bold text-blue-900' : 'border-gray-200 focus:border-blue-400'}`}
                                />
                                <Package className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isExistingItem ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>

                            <div className="flex-shrink-0 min-w-[180px]">
                                {inputUnitOptions.length > 0 ? (
                                    <Select
                                        options={inputUnitOptions}
                                        value={_.find(inputUnitOptions, { value: formData.input_unit_id }) || null}
                                        onValueChange={(opt) => handleChange("input_unit_id", opt?.value || "")}
                                        placeholder="Pilih satuan..."
                                    />
                                ) : (
                                    <div className="h-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm flex items-center">
                                        Pilih satuan terkecil di atas
                                    </div>
                                )}
                            </div>
                        </div>

                        {qtyPreview && (
                            <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-700 font-medium">
                                    Sistem akan menyimpan: <span className="font-bold">{qtyPreview}</span> ke Gudang
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        form="single-item-form"
                        disabled={loading || isCheckingBarcode}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {isExistingItem ? "Simpan Penambahan Stok" : "Daftarkan Barang Baru"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}