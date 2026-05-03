import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Package, CheckCircle, PackageOpen, Tag, Info } from 'lucide-react';

interface InventoryLoan {
    id: number;
    transaction_id: number;
    item_id: number;
    nik: string;
    qty_borrowed: number;
    qty_returned: number;
    status: 'BORROWED' | 'PARTIAL_RETURNED' | 'RETURNED';
    borrowed_at: string;
    returned_at: string | null;
    item: {
        id: number;
        name: string;
        barcode: string;
        base_unit?: { id: number, name: string };
    };
    created_by_user: {
        id_user: string;
        nama_user: string;
    };
}

interface LoanCardProps {
    loan: InventoryLoan;
}

const statusConfig = {
    'BORROWED': {
        label: 'Sedang Dipinjam',
        icon: <PackageOpen className="w-4 h-4 text-orange-600" />,
        style: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    'PARTIAL_RETURNED': {
        label: 'Dikembalikan Sebagian',
        icon: <CheckCircle className="w-4 h-4 text-yellow-600" />,
        style: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    'RETURNED': {
        label: 'Selesai (Dikembalikan)',
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        style: 'bg-green-100 text-green-800 border-green-300',
    }
};

const LoanCard: React.FC<LoanCardProps> = ({ loan }) => {
    moment.locale('id');
    const { label, icon, style } = statusConfig[loan.status];
    const remaining = loan.qty_borrowed - loan.qty_returned;
    const unitName = loan.item?.base_unit?.name || 'Unit';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full transition-all hover:shadow-md relative">
            <div className="p-5 flex-grow space-y-4">
                <div className="flex justify-between items-start gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                        {icon}
                        <span>{label}</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2" title={loan.item?.name}>
                        {loan.item?.name || "Aset Tidak Dikenal"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-mono">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{loan.item?.barcode || "-"}</span>
                    </div>
                </div>

                <div className="border-t border-gray-100"></div>
                <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Tanggal Pinjam</p>
                            <span className="font-medium">{moment(loan.borrowed_at).format('DD MMM YYYY, HH:mm')}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <Package className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Sisa Tanggungan</p>
                            <span className="font-bold text-orange-600 text-base">{remaining} {unitName}</span>
                            {loan.qty_returned > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Total awal: {loan.qty_borrowed} | Sisa: {remaining}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 border-t flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4 text-gray-400" />
                <span>Diserahkan oleh: <b>{loan.created_by_user?.nama_user || "-"}</b></span>
            </div>
        </div>
    );
};

export default LoanCard;