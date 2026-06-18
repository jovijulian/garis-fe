"use client";

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import DateRangePicker from '@/components/common/DateRangePicker'; // Gunakan DateRangePicker Anda
import Select from '@/components/form/Select-custom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { endpointUrl, httpGet } from '@/../helpers';
import { FileDown, Loader2 } from 'lucide-react';
import _ from 'lodash';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}



const ExportInventoryItemModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    // State untuk filter di dalam modal
    const [startDate, setStartDate] = useState<string | null>(moment().startOf('month').format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState<string | null>(moment().endOf('month').format("YYYY-MM-DD"));
    const [status, setStatus] = useState<string>(''); // Default 'Semua Status'
    const [isDownloading, setIsDownloading] = useState(false);
    const [siteOptions, setSiteOptions] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const handleDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        setStartDate(dates.startDate);
        setEndDate(dates.endDate);
    };
    const [stockStatus, setStockStatus] = useState<string>("");
    useEffect(() => {
        fetchOptions();
    }, [])

    const fetchOptions = async () => {
        try {
            const siteRes = await httpGet(endpointUrl("/rooms/site-options"), true);

            const formattedSite = siteRes.data.data.map((site: any) => ({
                value: site.id_cab,
                label: `${site.nama_cab}`,
            }));

            setSiteOptions(formattedSite);
        } catch (error) {
            console.log(error)
            toast.error("Gagal memuat data cabang / fasilitas / topik.");
        }
    };

    const handleDownload = async () => {
        if (!startDate || !endDate) {
            toast.error("Silakan pilih rentang tanggal terlebih dahulu.");
            return;
        }

        setIsDownloading(true);
        toast.loading("Sedang mempersiapkan file Excel...");

        const params = new URLSearchParams({
            startDate: startDate,
            endDate: endDate,
        });
        if (selectedSite) {
            params.append('cab_id', selectedSite ? selectedSite.value : "");
        }
        if (stockStatus) {
            params.append('stock_status', stockStatus);
        }

        try {
            const response = await fetch(endpointUrl(`/inventory-items/export-excel?${params.toString()}`), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || "Gagal men-download laporan.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_item_report_${moment().format('YYYY-MM-DD')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success("File Excel berhasil di-download!");
            onClose(); // Tutup modal setelah sukses

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message || "Terjadi kesalahan.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
            <div className="p-6">
                <h3 className="text-xl font-semibold mb-5">Export Laporan Transaksi</h3>
                <div className="space-y-4 grid">
                    <div>
                        <label className="block font-medium mb-2">Pilih Rentang Tanggal</label>
                        <DateRangePicker
                            onDatesChange={handleDatesChange}
                            initialStartDate={startDate}
                            initialEndDate={endDate}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-2">Filter Berdasarkan Cabang</label>
                        <Select
                            options={siteOptions}
                            onValueChange={(value) => setSelectedSite(value)}
                            value={siteOptions.find(opt => opt.value == selectedSite)}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-2">
                            Status Stok
                        </label>

                        <div className="grid grid-cols-3 gap-3">

                            <button
                                type="button"
                                onClick={() => setStockStatus("")}
                                className={`px-3 py-2 rounded-lg border text-sm ${stockStatus === ""
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white border-gray-300"
                                    }`}
                            >
                                Semua
                            </button>


                            <button
                                type="button"
                                onClick={() => setStockStatus("1")}
                                className={`px-3 py-2 rounded-lg border text-sm ${stockStatus === "1"
                                        ? "bg-green-600 text-white border-green-600"
                                        : "bg-white border-gray-300"
                                    }`}
                            >
                                Ready
                            </button>


                            <button
                                type="button"
                                onClick={() => setStockStatus("0")}
                                className={`px-3 py-2 rounded-lg border text-sm ${stockStatus === "0"
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-white border-gray-300"
                                    }`}
                            >
                                Habis
                            </button>

                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDownloading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileDown size={18} />}
                        {isDownloading ? 'Memproses...' : 'Download Laporan'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportInventoryItemModal;