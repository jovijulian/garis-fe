"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import DateRangePicker from '@/components/common/DateRangePicker'; // Gunakan DateRangePicker Anda
import Select from '@/components/form/Select-custom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { endpointUrl } from '@/../helpers';
import { FileDown, Loader2 } from 'lucide-react';
import _ from 'lodash';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'Submit', label: 'Submit' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Canceled', label: 'Canceled' },
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    // State untuk filter di dalam modal
    const [startDate, setStartDate] = useState<string | null>(moment().startOf('month').format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState<string | null>(moment().endOf('month').format("YYYY-MM-DD"));
    const [status, setStatus] = useState<string>(''); // Default 'Semua Status'
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        setStartDate(dates.startDate);
        setEndDate(dates.endDate);
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
        if (status) {
            params.append('status', status);
        }

        try {
            const response = await fetch(endpointUrl(`/accommodations/export-excel?${params.toString()}`), {
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
            a.download = `order_report_${moment().format('YYYY-MM-DD')}.xlsx`;
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
                <h3 className="text-xl font-semibold mb-5">Export Laporan Order</h3>
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
                        <label className="block font-medium mb-2">Filter Berdasarkan Status</label>
                        <Select
                            options={statusOptions}
                            onValueChange={(opt) => setStatus(opt ? opt.value : '')}
                            // value={statusOptions.find(opt => opt.value === status) || null}
                            value={_.find(statusOptions, { value: status })}
                        />
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

export default ExportModal;