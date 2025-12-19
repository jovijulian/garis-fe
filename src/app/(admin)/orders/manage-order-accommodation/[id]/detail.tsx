"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    FaUser, FaBuilding, FaUsers, FaClock, FaClipboardList, FaStickyNote, FaPrint,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBed, FaCalendarAlt, FaMale, FaFemale
} from "react-icons/fa";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import { CircleX, Printer } from "lucide-react";
import CancelOrderModal from "@/components/modal/CancelOrderModal";
interface GuestItem {
    id: number;
    guest_name: string;
    gender: 'Laki-laki' | 'Perempuan';
}

interface AccommodationData {
    id: number;
    user_id: string;
    cab_id: number;
    check_in_date: string;
    check_out_date: string;
    room_needed: string;
    total_pax: number;
    total_male: number;
    total_female: number;
    note: string | null;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    created_at: string;
    updated_at: string;
    approved_by: string | null;
    guests: GuestItem[];
    cabang: { nama_cab: string; };
    user: { nama_user: string; };
}

export default function AccommodationAdminDetailPage() {
    const [data, setData] = useState<AccommodationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const id = Number(params.id);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    moment.locale('id');

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            // Mengambil data dari endpoint akomodasi
            const response = await httpGet(endpointUrl(`accommodations/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail akomodasi.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    const getStatusBadge = (status: string) => {
        const statusMap = {
            'Approved': { icon: <FaCheckCircle />, color: 'green', label: 'Approved' },
            'Rejected': { icon: <FaTimesCircle />, color: 'red', label: 'Rejected' },
            'Canceled': { icon: <FaTimesCircle />, color: 'red', label: 'Canceled' },
            'Submit': { icon: <FaHourglassHalf />, color: 'yellow', label: 'Submit' },
        };
        const currentStatus = statusMap[status as keyof typeof statusMap] || statusMap['Submit'];
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                {currentStatus.icon} {currentStatus.label}
            </div>
        );
    };

    const handlePrint = async () => {
        try {
            const response = await httpGet(endpointUrl(`accommodations/${id}/receipt`), true);
            const htmlContent = response.data;

            if (!htmlContent) {
                toast.error('Gagal mendapatkan data nota akomodasi.');
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.contentDocument?.open();
            iframe.contentDocument?.write(htmlContent);
            iframe.contentDocument?.close();

            iframe.onload = function () {
                iframe.contentWindow?.print();
                setTimeout(() => { document.body.removeChild(iframe); }, 1000);
            };
        } catch (error) {
            toast.error('Terjadi kesalahan saat mencetak nota.');
        }
    };

    const handleUpdateStatus = async () => {
        if (!actionType || !data) return;
        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`accommodations/status/${data.id}`), { status: actionType }, true);
            toast.success(`Pesanan akomodasi berhasil di-${actionType}`);
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };

    const handleConfirmCancel = async () => {
        if (!data) return;
        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`accommodations/cancel/${data.id}`), {}, true);
            toast.success("Pesanan akomodasi berhasil dibatalkan.");
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan pesanan.");
        } finally {
            setIsSubmitting(false);
            setIsCancelModalOpen(false);
        }
    };

    if (isLoading) return <p className="text-center mt-10">Memuat data akomodasi...</p>;
    if (!data) return <p className="text-center mt-10">Data tidak ditemukan.</p>;

    return (
        <ComponentCard title="Detail Admin - Pesanan Akomodasi">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        {data.room_needed}
                    </h1>
                    <p className="text-gray-500">Diajukan oleh: <strong>{data.user.nama_user}</strong></p>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(data.status)}
                    {data.status === 'Approved' && (
                        <>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
                                <Printer size={18} /> Cetak Nota
                            </button>
                            <button onClick={() => setIsCancelModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition">
                                <CircleX className="text-red-500" size={18} /> Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Panel Info Utama */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <DetailItem icon={<FaBuilding />} label="Site/Cabang" value={data.cabang.nama_cab} />
                <DetailItem icon={<FaCalendarAlt />} label="Check In" value={moment(data.check_in_date).format('DD MMM YYYY')} />
                <DetailItem icon={<FaCalendarAlt />} label="Check Out" value={moment(data.check_out_date).format('DD MMM YYYY')} />
                <DetailItem 
                    icon={<FaUsers />} 
                    label="Total Tamu" 
                    value={`${data.total_pax} Orang (${data.total_male}L, ${data.total_female}P)`} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Kolom Kiri: Daftar Tamu */}
                <div className="lg:col-span-3 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaClipboardList /> Daftar Tamu Menginap
                    </h4>
                    {data.guests.map((guest, index) => (
                        <div key={guest.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800 text-lg">{guest.guest_name}</h5>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            {guest.gender === 'Laki-laki' ? <FaMale className="text-blue-500" /> : <FaFemale className="text-pink-500" />}
                                            {guest.gender}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Kolom Kanan: Kebutuhan Kamar & Catatan */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border rounded-lg p-5">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaBed className="text-blue-500" /> Kebutuhan Kamar
                        </h4>
                        <p className="text-gray-800 font-medium p-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
                            {data.room_needed}
                        </p>
                    </div>

                    <div className="bg-white border rounded-lg p-5">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaStickyNote className="text-yellow-500" /> Catatan Tambahan
                        </h4>
                        {data.note ? (
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap italic">
                                "{data.note}"
                            </p>
                        ) : (
                            <p className="text-gray-500 italic">Tidak ada catatan tambahan.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Aksi Persetujuan Admin */}
            {data.status === 'Submit' && (
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    <button 
                        className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition" 
                        onClick={() => { setActionType("Rejected"); setIsStatusModalOpen(true); }}
                    >
                        Tolak
                    </button>
                    <button 
                        className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition" 
                        onClick={() => { setActionType("Approved"); setIsStatusModalOpen(true); }}
                    >
                        Setujui
                    </button>
                </div>
            )}

            {/* Modal Components */}
            <ChangeStatusOrderModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onConfirm={handleUpdateStatus}
                order={data}
                actionType={actionType}
                isSubmitting={isSubmitting}
            />
            <CancelOrderModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                order={data}
                isSubmitting={isSubmitting}
            />
        </ComponentCard>
    );
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 shadow-sm transition hover:shadow-md">
        <div className="text-gray-400 mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-bold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);