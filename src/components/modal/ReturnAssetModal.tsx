"use client";

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import Select from '@/components/form/Select-custom';
import { toast } from 'react-toastify';
import { endpointUrl, httpPost } from '@/../helpers';
import { Loader2, RefreshCcw, Info, Check } from 'lucide-react';
import _ from 'lodash';

interface ReturnAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    loan: any; 
}

const ReturnAssetModal: React.FC<ReturnAssetModalProps> = ({ isOpen, onClose, onSuccess, loan }) => {
    const [qty, setQty] = useState("");
    const [unitId, setUnitId] = useState<string>("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const availableUnits = useMemo(() => {
        if (!loan?.item) return [];
        const opts = [];
        
        opts.push({
            value: String(loan.item.base_unit_id),
            label: loan.item.base_unit?.name || "Satuan",
            multiplier: 1,
            unitName: loan.item.base_unit?.name
        });

        if (loan.uoms && Array.isArray(loan.uoms)) {
            loan.uoms.forEach((u: any) => {
                opts.push({
                    value: String(u.unit_id),
                    label: `${u.unit?.name} (1 = ${u.multiplier} ${loan.item.base_unit?.name})`,
                    multiplier: u.multiplier,
                    unitName: u.unit?.name
                });
            });
        }
        return opts;
    }, [loan]);

    React.useEffect(() => {
        if (availableUnits.length > 0 && !unitId) {
            setUnitId(availableUnits[0].value);
        }
    }, [availableUnits, unitId]);

    const handleSubmit = async () => {
        if (!qty || Number(qty) <= 0) {
            toast.warning("Masukkan jumlah barang yang dikembalikan");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                loan_id: loan.id,
                return_qty: Number(qty),
                input_unit_id: Number(unitId),
                note: note
            };

            await httpPost(endpointUrl("inventory-transactions/return"), payload, true);
            toast.success("Pengembalian barang berhasil diproses!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memproses pengembalian");
        } finally {
            setLoading(false);
        }
    };

    const remaining = loan?.qty_borrowed - loan?.qty_returned;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Pengembalian Aset</h2>
                
                <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                    <p className="text-sm text-gray-600">Barang: <span className="font-bold text-gray-900">{loan?.item?.name}</span></p>
                    <p className="text-sm text-gray-600 mt-1">
                        Sisa Pinjaman: <span className="font-bold text-orange-600">{remaining} {loan?.item?.base_unit?.name}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Jumlah Dikembalikan</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="Contoh: 1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Satuan</label>
                        <Select
                            options={availableUnits}
                            value={_.find(availableUnits, { value: unitId }) || null}
                            onValueChange={(opt) => setUnitId(opt?.value || "")}
                            placeholder="Pilih Satuan..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Catatan</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                            rows={2}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4"/> : null}
                        Proses Pengembalian
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReturnAssetModal;