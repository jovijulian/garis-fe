import { Star, Users } from 'lucide-react';
import React from 'react';

interface RankProps {
    title: string;
    subtitle: string;
    iconType?: 'star' | 'users';
    data: { name: string; sub_info: string; count: number }[];
}

export const TopInventoryList = ({ title, subtitle, iconType = 'star', data }: RankProps) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${iconType === 'users' ? 'bg-purple-100 text-purple-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {iconType === 'users' ? <Users className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
                    {subtitle}
                </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                {data && data.length > 0 ? (
                    data.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 border border-transparent hover:border-slate-200 dark:hover:border-gray-600 transition-all duration-200">
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                    ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' : 
                                      index === 1 ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300' : 
                                      index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 
                                      'bg-blue-50 text-blue-600'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.sub_info}</p>
                                </div>
                            </div>
                            <div className="text-right bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                <p className="text-base font-bold text-blue-600">{item.count} <span className="text-xs font-medium text-gray-400">Trx</span></p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        Belum ada data tersedia.
                    </div>
                )}
            </div>
        </div>
    );
};