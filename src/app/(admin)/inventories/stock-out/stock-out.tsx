"use client";

import { useState, useEffect, useRef } from "react";
import {
    Check, PackageMinus, ScanBarcode, Camera, X, Loader2, Trash2, ShoppingCart, User
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { endpointUrl, httpPost, httpGet } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import _ from "lodash";

interface CartItem {
    item_id: number;
    name: string;
    barcode: string;
    input_qty: any;
    input_unit_id: number;
    unit_name: string;
    stock_available: number;
    item_type: number;
}

export default function StockOutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
    const [headerData, setHeaderData] = useState({
        cab_id: 0,
        user_id_borrower: "",
        note: "",
    });

    const [barcodeInput, setBarcodeInput] = useState("");
    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        const cabId = localStorage.getItem("sites");
        setHeaderData(prev => ({ ...prev, cab_id: cabId ? Number(cabId) : 0 }));

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
            }
        };
    }, []);

    const handleCheckBarcode = async (scannedBarcode: string) => {
        if (!scannedBarcode || scannedBarcode.trim() === "") return;
        if (isCheckingBarcode) return; // Mencegah double scan

        setIsCheckingBarcode(true);
        try {
            const res = await httpGet(endpointUrl(`/inventory-items/check-barcode/${scannedBarcode}?cab_id=${headerData.cab_id}`), true);
            const result = res.data?.data;

            if (result?.is_existing) {
                const item = result.data;
                if (item.stock_available <= 0) {
                    toast.error(`Stok ${item.name} sedang kosong!`);
                    setBarcodeInput("");
                    return;
                }

                setCart(prevCart => {
                    const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item_id === item.id);
                    const newCart = [...prevCart];

                    if (existingItemIndex >= 0) {
                        const currentQty = newCart[existingItemIndex].input_qty;
                        if (currentQty < item.stock_available) {
                            newCart[existingItemIndex].input_qty += 1;
                            toast.success(`+1 ${item.name} ditambahkan`);
                        } else {
                            toast.warning(`Stok ${item.name} tidak cukup (Sisa: ${item.stock_available})`);
                        }
                    } else {
                        newCart.push({
                            item_id: item.id,
                            name: item.name,
                            barcode: item.barcode,
                            input_qty: 1,
                            input_unit_id: item.base_unit_id,
                            unit_name: item.base_unit?.name || "Unit",
                            stock_available: item.stock_available,
                            item_type: item.item_type
                        });
                        toast.success(`${item.name} masuk keranjang`);
                    }
                    return newCart;
                });

            } else {
                toast.error("Barang tidak ditemukan di database!");
            }
        } catch (error) {
            console.error("Error checking barcode:", error);
            toast.error("Gagal memeriksa barcode. Pastikan koneksi stabil.");
        } finally {
            setIsCheckingBarcode(false);
            setBarcodeInput("");
            document.getElementById("barcode-input")?.focus();
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
                qrbox: { width: 300, height: 120 }, 
                aspectRatio: 1.777778,
                videoConstraints: {
                    facingMode: "environment",
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    advanced: [{ focusMode: "continuous" } as any] 
                },
                
                disableFlip: false,
            };
            const newScanner = new Html5QrcodeScanner(`reader-checkout`, config, false);
            scannerRef.current = newScanner;

            newScanner.render(
                (decodedText) => {
                    handleCheckBarcode(decodedText);
                },
                (errorMessage) => { /* Abaikan error per frame */ }
            );
        }, 100);
    };

    const updateCartQty = (index: number, newQty: number | "") => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];

            if (newQty === "") {
                newCart[index].input_qty = "";
                return newCart;
            }

            if (newQty > item.stock_available) {
                toast.warning(`Maksimal stok yang bisa dikeluarkan: ${item.stock_available}`);
                newCart[index].input_qty = item.stock_available;
            } else if (newQty > 0) {
                newCart[index].input_qty = newQty;
            }

            return newCart;
        });
    };

    const removeCartItem = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!headerData.user_id_borrower) {
            toast.warning("Mohon isi NIK / ID Karyawan yang meminta barang.");
            document.getElementById("user_id_borrower")?.focus();
            return;
        }

        if (cart.length === 0) {
            toast.warning("Keranjang kosong! Scan barang terlebih dahulu.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nik: headerData.user_id_borrower,
                note: headerData.note,
                items: cart.map(item => ({
                    item_id: item.item_id,
                    input_qty: item.input_qty,
                    input_unit_id: item.input_unit_id
                }))
            };

            await httpPost(endpointUrl("/inventory-transactions/stock-out"), payload, true);

            toast.success("Barang berhasil dikeluarkan!");

            setHeaderData(prev => ({ ...prev, user_id_borrower: "", note: "" }));
            setCart([]);
            setBarcodeInput("");

            if (isScannerActive) toggleScanner();

        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal memproses pengeluaran barang.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Pengeluaran Barang (Stock Out)">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="user_id_borrower" className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            NIK / User Peminta <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="user_id_borrower" type="text" required
                            value={headerData.user_id_borrower}
                            onChange={(e) => setHeaderData(prev => ({ ...prev, user_id_borrower: e.target.value }))}
                            placeholder="Contoh: NIK Karyawan"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="user_id_borrower" className="text-sm font-medium text-gray-800 flex items-center gap-2">Catatan / Keperluan</label>
                        <input
                            id="note" type="text"
                            value={headerData.note}
                            onChange={(e) => setHeaderData(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Contoh: Permintaan ATK Divisi Keuangan"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-800">Scan Barcode Barang</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="barcode-input"
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCheckBarcode(barcodeInput);
                                    }
                                }}
                                placeholder="Scan barang di sini lalu tekan Enter..."
                                className="w-full pl-12 pr-10 py-4 border-2 border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm outline-none transition-all bg-white shadow-sm font-medium"
                            />
                            {isCheckingBarcode && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />}
                        </div>

                        <button
                            type="button"
                            onClick={toggleScanner}
                            className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-medium transition-all flex-shrink-0 sm:w-auto w-full ${isScannerActive
                                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                }`}
                        >
                            {isScannerActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                            <span>{isScannerActive ? "Tutup Kamera" : "Gunakan Kamera"}</span>
                        </button>
                    </div>

                    {isScannerActive && (
                        <div className="mt-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl relative flex flex-col items-center max-w-lg mx-auto">
                            <div id="reader-checkout" className="w-full rounded-lg overflow-hidden"></div>
                            <p className="text-sm text-blue-700 mt-4 font-medium flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Arahkan barcode ke kamera...
                            </p>
                        </div>
                    )}
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Daftar Barang yang Dikeluarkan</h3>
                        <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs font-bold ml-auto">
                            {cart.length} Jenis Item
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Barang</th>
                                    <th className="px-6 py-4">Tipe</th>
                                    <th className="px-6 py-4">Sisa Gudang</th>
                                    <th className="px-6 py-4 w-40">Qty Keluar</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <PackageMinus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            Belum ada barang di keranjang. <br /> Silakan scan barcode di atas.
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{item.barcode || "Tanpa Barcode"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${item.item_type === 1 ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.item_type === 1 ? "BHP" : "ASET"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {item.stock_available} {item.unit_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number" min="1" max={item.stock_available}
                                                        value={item.input_qty}
                                                        onChange={(e) => {
                                                            const value = e.target.value;

                                                            if (value === "") {
                                                                updateCartQty(index, "");
                                                            } else {
                                                                updateCartQty(index, parseInt(value));
                                                            }
                                                        }}
                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-500 font-medium">{item.unit_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeCartItem(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus dari keranjang"
                                                >
                                                    <Trash2 className="w-5 h-5 mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading || cart.length === 0}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {loading ? "Memproses Transaksi..." : "Selesaikan & Keluarkan Barang"}
                    </button>
                </div>

            </form>
        </ComponentCard>
    );
}