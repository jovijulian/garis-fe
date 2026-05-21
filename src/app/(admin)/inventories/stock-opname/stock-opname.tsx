"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Check, Loader2, PackageOpen, ScanBarcode, Camera, X, Info, Layers, AlertTriangle } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "react-toastify";
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

export default function StockOpnamePage() {
    const [loading, setLoading] = useState(false);
    const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [itemOptions, setItemOptions] = useState<any[]>([]);
    const [selectedItemData, setSelectedItemData] = useState<any>(null);
    const [actualQty, setActualQty] = useState<string>("");
    const [selectedUnitId, setSelectedUnitId] = useState<string>("");
    const [note, setNote] = useState<string>("");

    const availableUnits = useMemo(() => {
        if (!selectedItemData) return [];
        const opts = [];

        opts.push({
            value: String(selectedItemData.base_unit_id),
            label: selectedItemData.base_unit?.name || "Satuan",
            multiplier: 1
        });

        if (selectedItemData.uoms && Array.isArray(selectedItemData.uoms)) {
            selectedItemData.uoms.forEach((u: any) => {
                opts.push({
                    value: String(u.unit_id),
                    label: `${u.unit?.name} (1 = ${u.multiplier} ${selectedItemData.base_unit?.name})`,
                    multiplier: u.multiplier
                });
            });
        }
        return opts;
    }, [selectedItemData]);

    useEffect(() => {
        if (selectedItemData) {
            setSelectedUnitId(String(selectedItemData.base_unit_id));
        }
    }, [selectedItemData]);

    const qtyPreview = useMemo(() => {
        if (!actualQty || !selectedUnitId || !selectedItemData) return null;
        const qty = Number(actualQty);
        const selectedUnit = availableUnits.find(u => u.value === selectedUnitId);
        if (!selectedUnit) return null;

        return `${qty * selectedUnit.multiplier} ${selectedItemData.base_unit?.name}`;
    }, [actualQty, selectedUnitId, selectedItemData, availableUnits]);

    const fetchItems = async () => {
        try {
            const res = await httpGet(endpointUrl("inventory-items/options"), true);
            const items = res.data?.data || [];
            setItemOptions(items.map((r: any) => ({
                value: r.id.toString(),
                label: `${r.name} ${r.barcode ? `(${r.barcode})` : ''}`
            })));
        } catch (error) {
            toast.error("Gagal memuat daftar barang.");
        }
    };

    useEffect(() => {
        fetchItems();
        return () => {
            if (scannerRef.current) scannerRef.current.clear().catch(e => console.error(e));
        };
    }, []);

    const handleItemSelect = async (id: string) => {
        if (!id) {
            setSelectedItemData(null);
            return;
        }
        try {
            const res = await httpGet(endpointUrl(`inventory-items/${id}`), true);
            setSelectedItemData(res.data?.data || res.data);
            setActualQty("");
            setNote("");
        } catch (error) {
            toast.error("Gagal memuat detail barang.");
        }
    };

    const handleCheckBarcode = async (scannedBarcode: string) => {
        if (isCheckingBarcode) return;
        setIsCheckingBarcode(true);
        try {
            const cabId = localStorage.getItem("sites");
            const res = await httpGet(endpointUrl(`/inventory-items/check-barcode/${scannedBarcode}?cab_id=${cabId}`), true);

            if (res.data?.data?.is_existing) {
                setSelectedItemData(res.data.data.data);
                toast.success("Barang ditemukan!");
                if (isScannerActive) toggleScanner();
            } else {
                toast.error("Barang tidak ditemukan!");
            }
        } catch (error) {
            toast.error("Gagal memeriksa barcode.");
        } finally {
            setIsCheckingBarcode(false);
            setBarcodeInput("");
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
            setIsScannerActive(true);
            startScanner();
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
            const newScanner = new Html5QrcodeScanner(`reader-opname`, config, false);
            scannerRef.current = newScanner;
    
            newScanner.render(
                (decodedText) => {
                    handleCheckBarcode(decodedText);
                },
                (errorMessage) => console.warn("Scan error:", errorMessage)
            );
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemData || actualQty === "" || !selectedUnitId || !note) {
            toast.warning("Mohon lengkapi data penyesuaian.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                item_id: Number(selectedItemData.id),
                input_qty: Number(actualQty),
                input_unit_id: Number(selectedUnitId),
                note: note
            };

            await httpPost(endpointUrl("inventory-transactions/adjustment"), payload, true);
            toast.success("Stok berhasil disesuaikan!");

            setSelectedItemData(null);
            setActualQty("");
            setNote("");
            fetchItems();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal melakukan penyesuaian.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Penyesuaian Stok (Stock Opname)">
            <style dangerouslySetInnerHTML={{ __html: `#reader-opname { width: 100% !important; border: none !important; } #reader-opname video { width: 100% !important; border-radius: 0.5rem !important; }` }} />
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <p>
                    Gunakan halaman ini jika terdapat perbedaan antara jumlah barang di rak fisik dengan jumlah di sistem.
                    Sistem akan otomatis mencatat selisihnya ke dalam riwayat transaksi sebagai <b>ADJUSTMENT</b>.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">1. Identifikasi Barang</label>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text" value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onBlur={(e) => handleCheckBarcode(e.target.value)}
                                placeholder="Scan barcode..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white"
                            />
                        </div>
                        <button type="button" onClick={toggleScanner} className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100">
                            {isScannerActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        </button>
                    </div>
                    {isScannerActive && <div id="reader-opname" className="mt-4 border-2 border-dashed rounded-xl"></div>}

                    <div className="relative">
                        <Select
                            options={itemOptions}
                            value={_.find(itemOptions, { value: String(selectedItemData?.id || "") }) || null}
                            onValueChange={(opt) => handleItemSelect(opt?.value || "")}
                            placeholder="Atau pilih barang dari daftar..."
                        />
                    </div>
                </div>

                {selectedItemData && (
                    <div className="space-y-6 pt-6 border-t border-gray-100 animate-in fade-in duration-500">
                        <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">
                                Stok Sistem: <strong>{selectedItemData.stock_available} {selectedItemData.base_unit?.name}</strong>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Stok Fisik</label>
                                <input
                                    type="number" min="0" required value={actualQty}
                                    onChange={(e) => setActualQty(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Satuan</label>
                                <Select
                                    options={availableUnits}
                                    value={_.find(availableUnits, { value: selectedUnitId }) || null}
                                    onValueChange={(opt) => setSelectedUnitId(opt?.value || "")}
                                    placeholder="Pilih satuan..."
                                />
                            </div>
                        </div>

                        {qtyPreview && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                                <Info className="w-4 h-4" />
                                <span>Hasil stok fisik ke sistem: <strong>{qtyPreview}</strong></span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Catatan Penyesuaian</label>
                            <textarea
                                required value={note} onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 border rounded-xl"
                                placeholder="Alasan penyesuaian..."
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Check />} Konfirmasi Stok Opname
                        </button>
                    </div>
                )}
            </form>
        </ComponentCard>
    );
}