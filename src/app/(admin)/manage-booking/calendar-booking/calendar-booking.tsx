"use client";

import React from 'react';
import BookingCalendar from '@/components/calendar/BookingCalendar';
import ComponentCard from '@/components/common/ComponentCard';

export default function CalendarPage() {
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Kalender Booking</h1>
                    <p className="text-gray-500 mt-1">Lihat semua jadwal booking dalam tampilan kalender.</p>
                </div>
            </div>
            
            {/* <ComponentCard title="Lihat semua jadwal booking dalam tampilan kalender."> */}
                <BookingCalendar />
            {/* </ComponentCard> */}
        </div>
    );
}