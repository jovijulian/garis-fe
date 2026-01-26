"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SystemAnnouncement() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const expiryDate = new Date('2026-02-01T23:59:59');
        const now = new Date();

        if (now < expiryDate) {
            setIsVisible(true);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="bg-yellow-500 text-black overflow-hidden relative z-50 h-10 flex items-center shadow-md">
            <div className="absolute left-0 top-0 bottom-0 bg-yellow-600 px-3 z-20 flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="ml-2 font-bold text-white text-xs md:text-sm whitespace-nowrap hidden md:block">
                    PENGUMUMAN
                </span>
            </div>

            <div className="whitespace-nowrap w-full absolute animate-marquee flex items-center">
                <span className="text-sm font-semibold pl-[120px] md:pl-[160px]">
                    !!PENGUMUMAN!!
                    Mohon Maaf, sehubungan dengan adanya pembaruan sistem Zona Waktu (Timezone),
                    data pengajuan lama yang tersimpan di cache aplikasi mungkin mengalami ketidaksesuaian jam.
                    <strong>Mohon lakukan refresh aplikasi terlebih dahulu</strong>.
                    Jika masih terdapat kendala pada data lama, silakan hapus data tersebut lalu lakukan pengajuan ulang.
                    Terima kasih atas pengertiannya.
                    !!PENGUMUMAN!!
                </span>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }
                /* Pause saat di-hover agar user bisa baca */
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}