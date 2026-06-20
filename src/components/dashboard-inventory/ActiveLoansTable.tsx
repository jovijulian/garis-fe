import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import moment from 'moment';

export const ActiveLoansTable = ({ data }: { data: any[] }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-orange-50/30 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aset Sedang Dipinjam (Belum Kembali)</h3>
                        <p className="text-sm text-gray-500">Monitor barang yang masih ditahan oleh karyawan.</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Aset / Barang</th>
                            <th className="px-6 py-4 font-semibold">Nama Peminjam</th>
                            <th className="px-6 py-4 font-semibold text-center">Tanggungan Qty</th>
                            <th className="px-6 py-4 font-semibold">Tgl Pinjam & Durasi</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data && data.length > 0 ? (
                            data.map((loan) => (
                                <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white">{loan.item_name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{loan.barcode}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                                        {loan.borrower_name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg">
                                            {loan.qty_remaining} {loan.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-700 dark:text-gray-300">{moment(loan.borrowed_at).format('DD MMM YYYY')}</div>
                                        <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${loan.days_borrowed > 7 ? 'text-red-500' : 'text-orange-500'}`}>
                                            <AlertCircle className="w-3 h-3" /> {loan.days_borrowed} hari berlalu
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                                            {loan.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-400 mb-3" />
                                    Bagus! Semua aset pinjaman telah dikembalikan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};