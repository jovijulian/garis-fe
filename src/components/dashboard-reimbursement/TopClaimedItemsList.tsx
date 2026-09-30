import React from 'react';
import { Receipt } from 'lucide-react';

export interface TopClaimedItem {
    item_name: string;
    claim_count: number;
    total_amount: string | number;
}

interface TopClaimedItemsListProps {
    title?: string;
    subtitle?: string;
    data: TopClaimedItem[];
}

export const TopClaimedItemsList: React.FC<TopClaimedItemsListProps> = ({
    title = "Top Kategori Biaya Klaim",
    subtitle = "Kategori pengeluaran dengan frekuensi klaim & nominal terbanyak",
    data
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
                    {subtitle}
                </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar flex-1">
                {data && data.length > 0 ? (
                    data.map((item, index) => {
                        const amountNum = typeof item.total_amount === 'string'
                            ? parseFloat(item.total_amount)
                            : (item.total_amount || 0);

                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 border border-transparent hover:border-slate-200 dark:hover:border-gray-600 transition-all duration-200"
                            >
                                <div className="flex items-center gap-4 min-w-0 pr-2">
                                    <div
                                        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                        ${
                                            index === 0
                                                ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400'
                                                : index === 1
                                                ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300 dark:bg-gray-700 dark:text-gray-300'
                                                : index === 2
                                                ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-400'
                                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                                            {item.item_name}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {item.claim_count} Klaim
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0">
                                    <p className="text-sm md:text-base font-bold text-blue-600 dark:text-blue-400">
                                        Rp {isNaN(amountNum) ? '0' : amountNum.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Belum ada data klaim tersedia.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopClaimedItemsList;
