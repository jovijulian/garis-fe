"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id'; // Import locale Indonesia
import { endpointUrl, httpGet } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import BookingFormModal from "@/components/booking/BookingFormModal";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import {
    FaCalendarAlt, FaClock, FaUser, FaBuilding, FaClipboardList,
    FaChair, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaStickyNote
} from "react-icons/fa";
import { Info } from "lucide-react";

// --- Definisikan Interface Data ---
interface AmenityItem {
    id: number; name: string;
}

interface BookingData {
    id: number;
    purpose: string;
    start_time: string;
    end_time: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    notes: string | null;
    user: { nama_user: string; };
    room: { id: number; name: string; };
    amenities: AmenityItem[];
}

export default function MyBookingDetailPage() {
    const [data, setData] = useState<BookingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    // State untuk modal
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    moment.locale('id'); // Set moment ke Bahasa Indonesia

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`bookings/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail booking.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    // Komponen Badge Status yang menarik
    const getStatusBadge = (status: string) => {
        if (status === 'Approved') {
            return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"><FaCheckCircle /> Disetujui</div>;
        }
        if (status === 'Rejected') {
            return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"><FaTimesCircle /> Ditolak</div>;
        }
        if (status === 'Canceled') {
            return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800"><Info /> Dibatalkan</div>;
        }
        return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"><FaHourglassHalf /> Menunggu Persetujuan</div>;
    };

    if (isLoading) return <p className="text-center mt-10 text-gray-400">Memuat detail booking...</p>;
    if (!data) return <p className="text-center mt-10 text-red-500">Data booking tidak ditemukan.</p>;

    const canBeModified = data.status === 'Submit';

    return (
        <>
            <ComponentCard title="Detail Booking Anda">
                {/* --- Bagian Informasi Utama --- */}
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start justify-between mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{data.purpose}</h3>
                            <p className="text-gray-500">Ruangan: <strong>{data.room.name}</strong></p>
                        </div>
                        {getStatusBadge(data.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
                        <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
                            <FaCalendarAlt className="w-6 h-6 text-gray-500" />
                            <div>
                                <span className="text-gray-500 block">Tanggal</span>
                                <span className="font-semibold text-base">{moment(data.start_time).format('dddd, DD MMMM YYYY')}</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
                            <FaClock className="w-6 h-6 text-gray-500" />
                            <div>
                                <span className="text-gray-500 block">Waktu</span>
                                <span className="font-semibold text-base">
                                    {moment(data.start_time).format('HH:mm')} - {moment(data.end_time).format('HH:mm')}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
                            <FaUser className="w-6 h-6 text-gray-500" />
                            <div>
                                <span className="text-gray-500 block">Diajukan Oleh</span>
                                <span className="font-semibold text-base">{data.user.nama_user}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Tombol Aksi untuk User (hanya jika status 'Submit') --- */}
                {canBeModified && (
                    <div className="flex justify-end gap-3 mb-6">
                        <button onClick={() => setDeleteModalOpen(true)} className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">
                            Batalkan
                        </button>
                        <button onClick={() => setFormModalOpen(true)} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
                            Ubah
                        </button>
                    </div>
                )}

                {/* --- Detail Fasilitas dan Catatan --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaClipboardList /> Fasilitas Dipesan</h4>
                        <div className="bg-white border rounded-lg p-5">
                            {data.amenities && data.amenities.length > 0 ? (
                                <ul className="space-y-3">
                                    {data.amenities.map(item => (
                                        <li key={item.id} className="flex items-center gap-3 text-gray-800">
                                            <FaChair className="text-gray-400" />
                                            <span>{item.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada fasilitas tambahan yang dipesan.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaStickyNote /> Catatan Tambahan</h4>
                        <div className="bg-white border rounded-lg p-5">
                            {data.notes ? (
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{data.notes}</p>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada catatan tambahan.</p>
                            )}
                        </div>
                    </div>
                </div>
            </ComponentCard>

            {/* --- Modal untuk Ubah & Hapus --- */}
            <BookingFormModal
                isOpen={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSuccess={getDetail}
                bookingData={data} // Kirim data booking saat ini untuk di-edit
            />

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                url={`bookings/${data?.id}`}
                itemName={data?.purpose || ""}
                selectedData={data}
                onSuccess={() => router.push('/manage-booking/my-bookings')} // Arahkan kembali ke daftar setelah hapus
                message="Booking berhasil dibatalkan!"
            />
        </>
    );
}