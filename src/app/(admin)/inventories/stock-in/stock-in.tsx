"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    Check, Package, ScanBarcode, Camera, X, Loader2, AlertCircle, Info, FileText
} from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
    const [cabId, setCabId] = useState<number>(0);

    // Menyimpan data barang yang berhasil di-scan
    const [scannedItem, setScannedItem] = useState<any>(null);

    // Payload murni untuk transaksi
    const [formData, setFormData] = useState({
        barcode: "",
        item_id: null as number | null,
        input_qty: "",
        input_unit_id: "",
        note: ""
    });

    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const storedCabId = localStorage.getItem("sites");
        setCabId(storedCabId ? Number(storedCabId) : 0);
        return () => {
            if (scannerRef.current) scannerRef.current.clear().catch(e => console.error(e));
        };
    }, []);

    // 1. MEMBENTUK DROPDOWN UOM DINAMIS BERDASARKAN BARANG YANG DI-SCAN
    const availableUnits = useMemo(() => {
        if (!scannedItem) return [];

        const opts = [];

        // Selalu masukkan Satuan Dasar (Base Unit) sebagai opsi pertama dengan multiplier 1
        opts.push({
            value: String(scannedItem.base_unit_id),
            label: scannedItem.base_unit?.name || "Satuan Terkecil",
            multiplier: 1,
            unitName: scannedItem.base_unit?.name
        });

        // Jika barang memiliki kemasan tambahan (Box, Dus, dll), masukkan ke dalam opsi
        if (scannedItem.uoms && Array.isArray(scannedItem.uoms)) {
            scannedItem.uoms.forEach((u: any) => {
                opts.push({
                    value: String(u.unit_id),
                    label: `${u.unit?.name} (1 = ${u.multiplier} ${scannedItem.base_unit?.name})`,
                    multiplier: u.multiplier,
                    unitName: u.unit?.name
                });
            });
        }
        return opts;
    }, [scannedItem]);

    // 2. PREVIEW PERKALIAN MATEMATIKA UNTUK USER
    const qtyPreview = useMemo(() => {
        if (!formData.input_qty || !formData.input_unit_id || !scannedItem) return null;

        const qty = Number(formData.input_qty);
        if (qty <= 0) return null;

        const selectedUnit = availableUnits.find(u => u.value === String(formData.input_unit_id));
        if (!selectedUnit) return null;

        const totalInBase = qty * selectedUnit.multiplier;

        if (selectedUnit.multiplier === 1) {
            return `${totalInBase} ${scannedItem.base_unit?.name}`;
        } else {
            return `${qty} ${selectedUnit.unitName} × ${selectedUnit.multiplier} = ${totalInBase} ${scannedItem.base_unit?.name}`;
        }
    }, [formData.input_qty, formData.input_unit_id, scannedItem, availableUnits]);


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
            setScannedItem(null);
            setFormData(prev => ({ ...prev, item_id: null, input_qty: "", input_unit_id: "", note: "" }));
            return;
        }

        setIsCheckingBarcode(true);
        try {
            // Gunakan state cabId yang sudah di-fetch di useEffect
            const res = await httpGet(endpointUrl(`/inventory-items/check-barcode/${scannedBarcode}?cab_id=${cabId}`), true);
            const responseData = res.data?.data;

            // Jika barang ADA di database
            if (responseData?.is_existing) {
                const item = responseData.data;
                setScannedItem(item);
                setFormData({
                    barcode: scannedBarcode,
                    item_id: item.id,
                    input_qty: "1",
                    input_unit_id: String(item.base_unit_id), // Default langsung terpilih satuan ecerannya
                    note: ""
                });
                toast.success("Barang ditemukan!");
            } else {
                // Jika barang TIDAK ADA, blokir user di sini
                setScannedItem(null);
                setFormData(prev => ({ ...prev, barcode: scannedBarcode, item_id: null }));
                toast.error("Barang belum terdaftar! Silakan daftarkan di Master Barang terlebih dahulu.");
            }
        } catch (error) {
            console.error("Error checking barcode:", error);
            setScannedItem(null);
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
                    setFormData(prev => ({ ...prev, barcode: decodedText }));
                    handleCheckBarcode(decodedText);
                },
                (errorMessage) => console.warn("Scan error:", errorMessage)
            );
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!scannedItem || !formData.item_id) {
            toast.warning("Silakan scan barcode barang yang valid terlebih dahulu.");
            return;
        }

        if (!formData.input_qty || Number(formData.input_qty) <= 0) {
            toast.warning("Masukkan jumlah stok yang valid untuk ditambahkan.");
            return;
        }
        if (!formData.input_unit_id) {
            toast.warning("Pilih satuan barang yang masuk.");
            return;
        }

        setLoading(true);

        try {
            const payloadStockIn = {
                item_id: formData.item_id,
                input_qty: Number(formData.input_qty),
                input_unit_id: Number(formData.input_unit_id),
                note: formData.note || "Penambahan stok gudang"
            };

            await httpPost(endpointUrl("/inventory-transactions/stock-in"), payloadStockIn, true);
            toast.success("Stok barang berhasil ditambahkan!");

            setScannedItem(null);
            setFormData({ barcode: "", item_id: null, input_qty: "", input_unit_id: "", note: "" });

        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal memproses penambahan stok");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Penerimaan Barang (Stock In)">
            <style dangerouslySetInnerHTML={{
                __html: `
                #reader-single {
                    width: 100% !important;
                    border: none !important;
                }
                #reader-single video {
                    width: 100% !important;
                    height: auto !important;
                    border-radius: 0.5rem !important;
                    object-fit: cover !important;
                }
                #reader-single__dashboard_section_csr select {
                    max-width: 100% !important;
                    padding: 6px !important;
                    border-radius: 6px !important;
                    border: 1px solid #cbd5e1 !important;
                    font-size: 12px !important;
                }
                #reader-single__dashboard_section_csr button {
                    background-color: #3b82f6 !important;
                    color: white !important;
                    border: none !important;
                    padding: 6px 12px !important;
                    border-radius: 6px !important;
                    font-size: 12px !important;
                    margin: 4px !important;
                }
                #reader-single__dashboard_section_swaplink {
                    display: none !important; /* Sembunyikan tulisan 'Scan an Image file' yang tidak perlu */
                }
            `}} />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-full overflow-x-hidden" id="stock-in-form">
                <div className="space-y-2 pb-4 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-800 flex items-center justify-between">
                        1. Identifikasi Barang
                        <span className="text-xs text-gray-500 font-normal">Wajib diisi</span>
                    </label>

                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.barcode}
                                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
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
                            <div className="mt-4 p-2 sm:p-4 border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl relative w-full overflow-hidden">
                                <div id="reader-single" className="w-full"></div>
                                <div className="mt-3 text-center w-full">
                                    <p className="text-xs text-blue-600 font-medium">
                                        Arahkan kamera ke barcode. Jaga jarak 10-15cm agar fokus.
                                    </p>
                                </div>
                            </div>
                        )}
                </div>

                {!scannedItem ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-center">
                        <Package className="w-10 h-10 text-gray-300 mb-3" />
                        <h4 className="text-sm font-semibold text-gray-600">Belum Ada Barang yang Dipilih</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">Silakan scan barcode barang terlebih dahulu untuk memulai penambahan stok.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        {scannedItem.name}
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${scannedItem.item_type === 1 ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {scannedItem.item_type === 1 ? 'BHP' : 'ASET'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Kategori: {scannedItem.category?.name || '-'} | Stok Saat Ini: <span className="font-bold text-gray-800">{scannedItem.stock_available} {scannedItem.base_unit?.name}</span>
                                    </p>
                                </div>
                                <div className="bg-blue-50 px-4 py-2 rounded-lg text-xs font-semibold text-blue-700 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Barang Valid
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-5">
                            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">2. Detail Penambahan Stok</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label htmlFor="input_qty" className="text-sm font-semibold text-gray-800">Jumlah Masuk <span className="text-red-500">*</span></label>
                                    <input
                                        id="input_qty" type="number" min="1" required
                                        value={formData.input_qty}
                                        onChange={(e) => setFormData(prev => ({ ...prev, input_qty: e.target.value }))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-800">Dalam Satuan <span className="text-red-500">*</span></label>
                                    <Select
                                        options={availableUnits}
                                        value={_.find(availableUnits, { value: formData.input_unit_id }) || null}
                                        onValueChange={(opt) => setFormData(prev => ({ ...prev, input_unit_id: opt?.value || "" }))}
                                        placeholder="Pilih Satuan Kemasan..."
                                    />
                                </div>
                            </div>

                            {qtyPreview && (
                                <div className="flex items-center gap-3 mt-2 px-4 py-3 bg-green-50/50 border border-green-200 rounded-xl">
                                    <div className="bg-green-100 p-1.5 rounded-lg">
                                        <Check className="w-4 h-4 text-green-700" />
                                    </div>
                                    <p className="text-sm text-green-800">
                                        Total masuk ke sistem: <span className="font-bold text-green-900">{qtyPreview}</span>
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" /> Catatan / Referensi (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="Contoh: Restock bulanan dari supplier Gramedia..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setScannedItem(null);
                                    setFormData({ barcode: "", item_id: null, input_qty: "", input_unit_id: "", note: "" });
                                }}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-sm w-full sm:w-auto"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                                Simpan Transaksi Masuk
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </ComponentCard>
    );
}