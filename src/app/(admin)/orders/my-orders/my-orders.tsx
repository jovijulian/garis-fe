"use client";
import React, { useState } from 'react';
import { Utensils, BedDouble, LayoutGrid } from 'lucide-react'; // Icon untuk tabs
import ConsumptionOrders from '@/components/order/ConsumptionOrders';
import AccommodationOrders from '@/components/order/AccommodationOrders';

export default function MyOrdersMainPage() {
    const [activeTab, setActiveTab] = useState<'consumption' | 'accommodation'>('consumption');

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header Utama */}
            

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('consumption')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                            ${activeTab === 'consumption'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Utensils className="w-4 h-4" />
                        Konsumsi
                    </button>

                    <button
                        onClick={() => setActiveTab('accommodation')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                            ${activeTab === 'accommodation'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <BedDouble className="w-4 h-4" />
                        Hotel
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'consumption' && <ConsumptionOrders />}
                {activeTab === 'accommodation' && <AccommodationOrders />}
            </div>
        </div>
    );
}