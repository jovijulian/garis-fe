"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import {
    FaHotel, FaCalendarCheck, FaCalendarTimes, FaUsers, FaBuilding, 
    FaStickyNote, FaCheckCircle, FaTimesCircle, FaHourglassHalf, 
    FaUserCheck, FaMale, FaFemale, FaClipboardList, FaBed
} from "react-icons/fa";

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
    room_needed: string | null;
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

export default function AccommodationOrderDetailPage() {
    const [data, setData] = useState<AccommodationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`accommodations/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail pesanan akomodasi.");
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

    if (isLoading) return <p className="text-center mt-10">Memuat data akomodasi...</p>;
    if (!data) return <p className="text-center mt-10">Pesanan tidak ditemukan.</p>;

    const canBeModified = data.status === 'Submit';

    return (
        <>
            <ComponentCard title="Detail Pesanan Akomodasi">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <FaHotel className="text-blue-600" /> {data.room_needed || 'Pemesanan Kamar'}
                        </h1>
                        <p className="text-gray-500">ID Pesanan: <strong>#{data.id}</strong></p>
                    </div>
                    {getStatusBadge(data.status)}
                </div>

                {canBeModified && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 flex-grow mb-2 md:mb-0">
                            Pesanan akomodasi masih bisa diubah atau dibatalkan sebelum diproses.
                        </p>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => router.push(`/orders/my-orders/accommodation/edit/${data.id}`)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                            >
                                Ubah
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<FaBuilding />} label="Site / Cabang" value={data.cabang.nama_cab} />
                    <DetailItem icon={<FaCalendarCheck />} label="Check In" value={moment(data.check_in_date).format('DD MMM YYYY')} />
                    <DetailItem icon={<FaCalendarTimes />} label="Check Out" value={moment(data.check_out_date).format('DD MMM YYYY')} />
                    <DetailItem icon={<FaUsers />} label="Total Tamu" value={`${data.total_pax} Orang (${data.total_male}L, ${data.total_female}P)`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FaClipboardList /> Daftar Tamu Menginap
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            {data.guests.map((guest, index) => (
                                <div key={guest.id} className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-800">{guest.guest_name}</h5>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                {guest.gender === 'Laki-laki' ? <FaMale className="text-blue-500" /> : <FaFemale className="text-pink-500" />}
                                                {guest.gender}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaBed /> Kebutuhan Kamar</h4>
                            <p className="text-gray-800 font-medium">{data.room_needed || '-'}</p>
                        </div>

                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaStickyNote /> Catatan Tambahan</h4>
                            {data.note ? (
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap text-sm italic">"{data.note}"</p>
                            ) : (
                                <p className="text-gray-500 italic text-sm">Tidak ada catatan tambahan.</p>
                            )}
                        </div>
                    </div>
                </div>

                {data.status !== 'Submit' && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaUserCheck /> Informasi Status</h4>
                        <div className="bg-white border rounded-lg p-5">
                            <p className="text-sm text-gray-600">
                                Status terakhir diperbarui pada <strong>{moment(data.updated_at).format('DD MMM YYYY, HH:mm')}</strong> 
                                oleh <strong>{data.approved_by || 'Sistem'}</strong>.
                            </p>
                        </div>
                    </div>
                )}
            </ComponentCard>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                url={`accommodations/${data?.id}`}
                selectedData={data}
                itemName={`Pesanan Akomodasi #${data?.id}`}
                onSuccess={() => router.push('/orders/my-orders/accommodation')}
                message="Pesanan akomodasi berhasil dibatalkan!"
            />
        </>
    );
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 shadow-sm">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-bold text-gray-800">{value || '-'}</span>
        </div>
    </div>
);