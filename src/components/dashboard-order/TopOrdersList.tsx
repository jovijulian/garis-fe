import { IdCard, List, Utensils } from 'lucide-react';
import React from 'react';

export const TopOrdersList = ({ data }: { data: any[] }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
        <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <List className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Komposisi Order</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
                Jumlah order berdasarkan kategori layanan
            </p>
        </div>

        <div className="space-y-2  overflow-y-auto pr-2">
            {data && data.length > 0 ? (
                data.map((type, index) => (
                    <div key={type.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-slate-100 hover:border-slate-200 transition-all duration-200 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold">
                                {index + 1}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{type.name}</h4>

                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">{type.total_quantity}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">
                    Tidak ada data tipe konsumsi tersedia.
                </div>
            )}
        </div>
    </div>
);