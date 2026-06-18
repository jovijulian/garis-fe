"use client";

import { useState, useEffect, useRef } from "react";
import {
    Check, PackageMinus, ScanBarcode, Camera, X, Loader2, Trash2, ShoppingCart, Info
} from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { endpointUrl, httpPost, httpGet } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import _, { set } from "lodash";

interface CartItem {
    item_id: number;
    name: string;
    barcode: string;
    input_qty: any;
    input_unit_id: number;
    base_unit_name: string;
    stock_available: number;
    item_type: number;
    available_uoms: { value: string, label: string, multiplier: number, unitName: string }[];
    selected_multiplier: number;
}

interface SelectOption { value: string; label: string; }

export default function StockOutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
    const [headerData, setHeaderData] = useState({
        cab_id: 0,
        user_id_borrower: "",
        note: "",
        user_id: null,
    });
    const [requestMode, setRequestMode] = useState<'self' | 'other'>('self');
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchInitialData = async () => {
        setLoadingOptions(true);
        setLoadingUsers(true);
        try {
            const [usersRes] = await Promise.all([
                httpGet(endpointUrl("/users/employee/options"), true),
            ]);
            setUserOptions(
                usersRes.data.data.map((u: any) => ({
                    value: u.id_user,
                    label: u.employee
                        ? `${u.id_user ?? '-'} - ${u.employee.nama ?? u.nama_user}`
                        : u.nama_user ?? 'Tanpa Nama',
                }))
            );

        } catch (error) {
            toast.error("Gagal memuat data awal untuk form.");
        } finally {
            setLoadingOptions(false);
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        const cabId = localStorage.getItem("sites");
        setHeaderData(prev => ({ ...prev, cab_id: cabId ? Number(cabId) : 0 }));

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
            }
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchChange = (val: string) => {
        setBarcodeInput(val);
        setShowDropdown(true);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!val.trim()) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await httpGet(endpointUrl(`/inventory-items/options?search=${val}`), true);
                setSearchResults(res.data?.data || []);
            } catch (error) {
                console.error("Error fetching options:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);
    };

    const handleSelectOption = (item: any) => {
        setBarcodeInput(item.barcode);
        setShowDropdown(false);
        setSearchResults([]);
        handleCheckBarcode(item.barcode);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            setShowDropdown(false);
            handleCheckBarcode(barcodeInput);
        }
    };

    const handleCheckBarcode = async (scannedBarcode: string) => {
        if (!scannedBarcode || scannedBarcode.trim() === "") return;
        if (isCheckingBarcode) return;

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

                const opts: any = [];
                opts.push({
                    value: String(item.base_unit_id),
                    label: item.base_unit?.name || "Satuan",
                    multiplier: 1,
                    unitName: item.base_unit?.name
                });

                if (item.uoms && Array.isArray(item.uoms)) {
                    item.uoms.forEach((u: any) => {
                        opts.push({
                            value: String(u.unit_id),
                            label: `${u.unit?.name} (1 = ${u.multiplier} ${item.base_unit?.name})`,
                            multiplier: u.multiplier,
                            unitName: u.unit?.name
                        });
                    });
                }

                setCart(prevCart => {
                    const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item_id === item.id);
                    const newCart = [...prevCart];

                    if (existingItemIndex >= 0) {
                        const currentCartItem = newCart[existingItemIndex];
                        const newQty = (currentCartItem.input_qty || 0) + 1;
                        const totalBaseDeduct = newQty * currentCartItem.selected_multiplier;

                        if (totalBaseDeduct <= item.stock_available) {
                            newCart[existingItemIndex].input_qty = newQty;
                            toast.success(`+1 ${item.name} ditambahkan`);
                        } else {
                            toast.warning(`Stok ${item.name} tidak cukup (Sisa: ${item.stock_available} ${item.base_unit?.name})`);
                        }
                    } else {
                        newCart.push({
                            item_id: item.id,
                            name: item.name,
                            barcode: item.barcode,
                            input_qty: 1,
                            input_unit_id: item.base_unit_id,
                            base_unit_name: item.base_unit?.name || "Unit",
                            stock_available: item.stock_available,
                            item_type: item.item_type,
                            available_uoms: opts,
                            selected_multiplier: 1
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
            const newScanner = new Html5QrcodeScanner(`reader-checkout`, config, false);
            scannerRef.current = newScanner;

            newScanner.render(
                (decodedText) => {
                    handleCheckBarcode(decodedText);
                },
                (errorMessage) => console.warn("Scan error:", errorMessage)
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

            const totalBaseDeduct = newQty * item.selected_multiplier;

            if (totalBaseDeduct > item.stock_available) {
                const maxQtyAllowed = Math.floor(item.stock_available / item.selected_multiplier);
                toast.warning(`Maksimal stok yang bisa dikeluarkan: ${maxQtyAllowed} unit terpilih (Sisa fisik: ${item.stock_available})`);
                newCart[index].input_qty = maxQtyAllowed;
            } else if (newQty > 0) {
                newCart[index].input_qty = newQty;
            }

            return newCart;
        });
    };

    const updateCartUnit = (index: number, newUnitId: string) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const selectedUom = item.available_uoms.find(u => u.value === newUnitId);

            if (selectedUom) {
                newCart[index].input_unit_id = Number(newUnitId);
                newCart[index].selected_multiplier = selectedUom.multiplier;
                const currentQty = newCart[index].input_qty || 0;
                const totalBaseDeduct = currentQty * selectedUom.multiplier;

                if (totalBaseDeduct > item.stock_available) {
                    const maxQtyAllowed = Math.floor(item.stock_available / selectedUom.multiplier);
                    toast.warning(`Stok gudang tidak cukup untuk ${currentQty} ${selectedUom.unitName}. Disesuaikan ke max: ${maxQtyAllowed}.`);
                    newCart[index].input_qty = maxQtyAllowed > 0 ? maxQtyAllowed : 1;
                }
            }
            return newCart;
        });
    };

    const removeCartItem = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // if (!headerData.user_id ) {
        //     toast.warning("Mohon isi Karyawan yang meminta barang.");
        //     document.getElementById("user_id_borrower")?.focus();
        //     return;
        // }

        if (cart.length === 0) {
            toast.warning("Keranjang kosong! Scan barang terlebih dahulu.");
            return;
        }

        const invalidItem = cart.find(c => !c.input_qty || c.input_qty <= 0);
        if (invalidItem) {
            toast.warning(`Pastikan jumlah keluaran untuk ${invalidItem.name} valid.`);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nik: headerData.user_id_borrower,
                note: headerData.note,
                user_id: headerData.user_id,
                items: cart.map(item => ({
                    item_id: item.item_id,
                    input_qty: Number(item.input_qty),
                    input_unit_id: item.input_unit_id
                }))
            };
            await httpPost(endpointUrl("/inventory-transactions/stock-out"), payload, true);

            toast.success("Barang berhasil dikeluarkan!");

            setHeaderData(prev => ({ ...prev, user_id_borrower: "", note: "", user_id: null }));
            setLoadingOptions(true);
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
            <style dangerouslySetInnerHTML={{
                __html: `
                #reader-checkout {
                    width: 100% !important;
                    border: none !important;
                }
                #reader-checkout video {
                    width: 100% !important;
                    height: auto !important;
                    border-radius: 0.5rem !important;
                    object-fit: cover !important;
                }
                #reader-checkout__dashboard_section_csr select {
                    max-width: 100% !important;
                    padding: 6px !important;
                    border-radius: 6px !important;
                    border: 1px solid #cbd5e1 !important;
                    font-size: 12px !important;
                }
                #reader-checkout__dashboard_section_csr button {
                    background-color: #3b82f6 !important;
                    color: white !important;
                    border: none !important;
                    padding: 6px 12px !important;
                    border-radius: 6px !important;
                    font-size: 12px !important;
                    margin: 4px !important;
                }
                #reader-checkout__dashboard_section_swaplink {
                    display: none !important; /* Sembunyikan tulisan 'Scan an Image file' yang tidak perlu */
                }
            `}} />
            <form onSubmit={handleSubmit} className="space-y-6 max-w-full overflow-x-hidden">
                <div className="bg-gray-50 p-5 sm:p-6 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">

                        <div>
                            <label className="text-sm font-medium text-gray-800 mb-3 block">
                                Peminta Barang
                            </label>

                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={requestMode === 'self'}
                                        onChange={() => {
                                            setRequestMode('self');
                                            setHeaderData(prev => ({
                                                ...prev,
                                                user_id: null
                                            }));
                                        }}
                                    />
                                    <span>Untuk Saya Sendiri</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={requestMode === 'other'}
                                        onChange={() => {
                                            setRequestMode('other');
                                        }}
                                    />
                                    <span>Untuk Karyawan Lain</span>
                                </label>
                            </div>
                        </div>

                        {requestMode === 'other' && (
                            <div className="space-y-2">
                                <label
                                    htmlFor="user_id_borrower"
                                    className="text-sm font-medium text-gray-800 flex items-center gap-2"
                                >
                                    Pilih Karyawan <span className="text-red-500">*</span>
                                </label>

                                <Select
                                    options={userOptions}
                                    value={_.find(userOptions, { value: headerData.user_id })}
                                    onValueChange={(opt) =>
                                        setHeaderData(prev => ({
                                            ...prev,
                                            user_id: opt ? opt.value : null
                                        }))
                                    }
                                    placeholder={
                                        loadingUsers
                                            ? "Memuat karyawan..."
                                            : "Cari nama / NIK karyawan..."
                                    }
                                />
                            </div>
                        )}

                    </div>
                    <div className="space-y-2">
                        <label htmlFor="note" className="text-sm font-medium text-gray-800 flex items-center gap-2">Catatan / Keperluan</label>
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
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => { if (barcodeInput && searchResults.length > 0) setShowDropdown(true); }}
                                placeholder="Ketik nama / scan barcode lalu tekan Enter"
                                autoComplete="off"
                                className="w-full pl-12 pr-10 py-4 border-2 border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm outline-none transition-all bg-white shadow-sm font-medium"
                            />
                            {(isCheckingBarcode || isSearching) && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin z-10" />
                            )}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectOption(item)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500 flex justify-between mt-1">
                                                <span className="text-blue-600">{item.barcode}</span>
                                                <span className="font-medium text-gray-600">
                                                    Stok: {item.stock_available} {item.base_unit?.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                        <div className="mt-4 p-2 sm:p-4 border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-2xl relative w-full overflow-hidden mx-auto">
                            <div id="reader-checkout" className="w-full rounded-lg overflow-hidden"></div>
                        </div>
                    )}
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-gray-50 px-5 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Daftar Barang Keluar</h3>
                        <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs font-bold ml-auto">
                            {cart.length} Item
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 sm:px-6 py-4 whitespace-nowrap">Nama Barang</th>
                                    <th className="px-5 sm:px-6 py-4 whitespace-nowrap">Sisa Fisik Gudang</th>
                                    <th className="px-5 sm:px-6 py-4 w-40 sm:w-64 whitespace-nowrap">Jumlah & Satuan Dikeluarkan</th>
                                    <th className="px-5 sm:px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                            <PackageMinus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            Belum ada barang di keranjang. <br /> Silakan scan barcode di atas.
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item, index) => {
                                        const isMultiplierActive = item.selected_multiplier > 1;
                                        const totalBaseDeduct = (item.input_qty || 0) * item.selected_multiplier;

                                        return (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 sm:px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{item.barcode || "-"}</div>
                                                    <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-md ${item.item_type === 1 ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.item_type === 1 ? "BHP" : "ASET PINJAMAN"}
                                                    </span>
                                                </td>
                                                <td className="px-5 sm:px-6 py-4">
                                                    <span className="font-bold text-gray-700 text-base">{item.stock_available}</span> <span className="text-gray-500">{item.base_unit_name}</span>
                                                </td>
                                                <td className="px-5 sm:px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number" min="1"
                                                                value={item.input_qty}
                                                                onChange={(e) => updateCartQty(index, e.target.value === "" ? "" : parseInt(e.target.value))}
                                                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                            />
                                                            <div className="w-[140px] sm:w-[160px]">
                                                                <Select
                                                                    options={item.available_uoms}
                                                                    value={_.find(item.available_uoms, { value: String(item.input_unit_id) }) || null}
                                                                    onValueChange={(opt) => updateCartUnit(index, opt?.value || "")}
                                                                    placeholder="Satuan"
                                                                    prefix={true}
                                                                />
                                                            </div>
                                                        </div>
                                                        {isMultiplierActive && totalBaseDeduct > 0 && (
                                                            <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 w-fit">
                                                                <Info className="w-3.5 h-3.5" />
                                                                Memotong fisik: <span className="font-bold">{totalBaseDeduct} {item.base_unit_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 sm:px-6 py-4 text-center">
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
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading || cart.length === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {loading ? "Memproses Transaksi..." : "Selesaikan Transaksi"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}