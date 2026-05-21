"use client";

import { useState, useEffect } from "react";
import {
    Check, X, Loader2, PackagePlus, Plus, Trash2, Layers, Tags, Box
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { endpointUrl, httpPost, httpGet } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

interface UomConversion {
    unit_id: string;
    multiplier: string;
}

interface BulkItem {
    id: string; 
    item_type: number;
    name: string;
    barcode: string;
    category_id: string;
    base_unit_id: string;
    stock_minimum: number;
    size: string;
    color: string;
    style: string;
    version: string;
    uoms: UomConversion[];
}

export default function BulkCreateMasterItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [cabId, setCabId] = useState<number>(0);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [unitOptions, setUnitOptions] = useState<any[]>([]);

    const [items, setItems] = useState<BulkItem[]>([]);

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
        const storedCabId = localStorage.getItem("sites");
        setCabId(storedCabId ? Number(storedCabId) : 0);
        addNewItem();
    }, []);

    const generateId = () => Math.random().toString(36).substring(7);

    const addNewItem = () => {
        setItems(prev => [
            ...prev,
            {
                id: generateId(),
                item_type: 1,
                name: "",
                barcode: "",
                category_id: "",
                base_unit_id: "",
                stock_minimum: 0,
                size: "",
                color: "",
                style: "",
                version: "",
                uoms: []
            }
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) {
            toast.info("Minimal harus ada 1 barang.");
            return;
        }
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof BulkItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };

    const addUomRow = (itemIndex: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const updatedItem = { ...newItems[itemIndex] };
            updatedItem.uoms = [...updatedItem.uoms, { unit_id: "", multiplier: "" }];
            newItems[itemIndex] = updatedItem;
            
            return newItems;
        });
    };

    const removeUomRow = (itemIndex: number, uomIndex: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const updatedItem = { ...newItems[itemIndex] };
            updatedItem.uoms = updatedItem.uoms.filter((_, idx) => idx !== uomIndex);
            
            newItems[itemIndex] = updatedItem;
            return newItems;
        });
    };

    const handleUomChange = (itemIndex: number, uomIndex: number, field: keyof UomConversion, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            const updatedItem = { ...newItems[itemIndex] };
            const updatedUoms = [...updatedItem.uoms];
            updatedUoms[uomIndex] = { ...updatedUoms[uomIndex], [field]: value };
            
            updatedItem.uoms = updatedUoms;
            newItems[itemIndex] = updatedItem;
            return newItems;
        });
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = items.every(item => item.name && item.category_id && item.base_unit_id);
        if (!isValid) {
            toast.warning("Mohon lengkapi Nama, Kategori, dan Satuan Eceran untuk semua barang.");
            return;
        }

        setLoading(true);

        try {
            const payloadBulk = items.map(item => ({
                cab_id: cabId,
                category_id: Number(item.category_id),
                barcode: item.barcode.trim() !== "" ? item.barcode : null,
                name: item.name,
                item_type: item.item_type,
                stock_minimum: Number(item.stock_minimum),
                base_unit_id: Number(item.base_unit_id),
                size: item.size.trim() !== "" ? item.size : null,
                color: item.color.trim() !== "" ? item.color : null,
                style: item.style.trim() !== "" ? item.style : null,
                version: item.version.trim() !== "" ? item.version : null,
                uoms: item.uoms
                    .filter(u => u.unit_id && u.multiplier)
                    .map(u => ({
                        unit_id: Number(u.unit_id),
                        multiplier: Number(u.multiplier)
                    }))
            }));

            await httpPost(endpointUrl("/inventory-items/bulk"), payloadBulk, true);
            router.push("/inventories/items");
            toast.success(`${payloadBulk.length} Katalog Barang Master berhasil didaftarkan!`);

        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal menyimpan data barang massal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Pendaftaran Massal Katalog Barang">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div key={item.id} className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm relative">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <Box className="w-5 h-5 text-blue-500" />
                                    Barang #{index + 1}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="col-span-1 md:col-span-3 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Barcode</label>
                                    <input
                                        type="text"
                                        value={item.barcode}
                                        onChange={(e) => handleItemChange(index, "barcode", e.target.value)}
                                        placeholder="Ketik..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-4 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Nama Barang <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required
                                        value={item.name}
                                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                        placeholder="Kertas HVS A4 Sidu 70gsm"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-3 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Kategori <span className="text-red-500">*</span></label>
                                    <Select
                                        options={categoryOptions}
                                        value={_.find(categoryOptions, { value: item.category_id }) || null}
                                        onValueChange={(opt) => handleItemChange(index, "category_id", opt?.value || "")}
                                        placeholder="Pilih Kategori"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Stok Min</label>
                                    <input
                                        type="number" min="0" required
                                        value={item.stock_minimum}
                                        onChange={(e) => handleItemChange(index, "stock_minimum", Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-4 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Jenis Inventaris <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-2 cursor-pointer rounded-lg border text-xs font-medium ${item.item_type === 1 ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200'}`}>
                                            <input type="radio" className="hidden" checked={item.item_type === 1} onChange={() => handleItemChange(index, "item_type", 1)} />
                                            BHP (Habis)
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-2 cursor-pointer rounded-lg border text-xs font-medium ${item.item_type === 2 ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200'}`}>
                                            <input type="radio" className="hidden" checked={item.item_type === 2} onChange={() => handleItemChange(index, "item_type", 2)} />
                                            Aset (Pinjam)
                                        </label>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-3 space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Satuan Terkecil <span className="text-red-500">*</span></label>
                                    <Select
                                        options={unitOptions}
                                        value={_.find(unitOptions, { value: item.base_unit_id }) || null}
                                        onValueChange={(opt) => handleItemChange(index, "base_unit_id", opt?.value || "")}
                                        placeholder="Pcs, Rim, dll"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-5 grid grid-cols-4 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Ukuran</label>
                                        <input type="text" value={item.size} onChange={(e) => handleItemChange(index, "size", e.target.value)} placeholder="20cm" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Warna</label>
                                        <input type="text" value={item.color} onChange={(e) => handleItemChange(index, "color", e.target.value)} placeholder="Putih" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Style</label>
                                        <input type="text" value={item.style} onChange={(e) => handleItemChange(index, "style", e.target.value)} placeholder="-" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Versi</label>
                                        <input type="text" value={item.version} onChange={(e) => handleItemChange(index, "version", e.target.value)} placeholder="-" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none" />
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-12 mt-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                                            <Layers className="w-4 h-4" /> Satuan Konversi
                                        </label>
                                        <button type="button" onClick={() => addUomRow(index)} disabled={!item.base_unit_id} className="text-xs px-2 py-1 bg-white border border-blue-200 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1 disabled:opacity-50">
                                            <Plus className="w-3 h-3" /> Tambah Kemasan
                                        </button>
                                    </div>

                                    {item.uoms.length > 0 && (
                                        <div className="space-y-2">
                                            {item.uoms.map((uom, uIdx) => (
                                                <div key={uIdx} className="flex items-center gap-2">
                                                    <div className="w-1/3">
                                                        <Select
                                                            options={unitOptions}
                                                            value={_.find(unitOptions, { value: uom.unit_id }) || null}
                                                            onValueChange={(opt) => handleUomChange(index, uIdx, "unit_id", opt?.value || "")}
                                                            placeholder="Pilih Satuan (Misal: Box)"
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">=</span>
                                                    <input
                                                        type="number" min="2"
                                                        value={uom.multiplier}
                                                        onChange={(e) => handleUomChange(index, uIdx, "multiplier", e.target.value)}
                                                        placeholder={`Jumlah ${unitOptions.find(u => u.value === item.base_unit_id)?.label || 'Eceran'} per kemasan`}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none bg-white"
                                                    />
                                                    <button type="button" onClick={() => removeUomRow(index, uIdx)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 gap-4">
                    <button
                        type="button"
                        onClick={addNewItem}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex justify-center items-center gap-2 border border-gray-300"
                    >
                        <PackagePlus className="w-5 h-5" />
                        Tambah Baris Barang Baru
                    </button>

                    <button
                        type="submit"
                        disabled={loading || items.length === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Simpan Semua Master Barang
                    </button>
                </div>

            </form>
        </ComponentCard>
    );
}