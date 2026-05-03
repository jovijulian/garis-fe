import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, PackageMinus, RefreshCcw, ArrowUpRight, Tag, Info, FileText } from 'lucide-react';

interface InventoryTransaction {
    id: number;
    transaction_type: string;
    qty: number;
    note: string;
    created_at: string;
    item: {
        id: number;
        name: string;
        barcode: string;
    };
    unit: {
        id: number;
        name: string;
    };
    created_by_user: {
        id_user: string;
        nama_user: string;
    };
}

interface TransactionCardProps {
    transaction: InventoryTransaction;
}

const getStatusConfig = (type: string) => {
    switch (type) {
        case 'OUT_BHP':
            return {
                label: 'BHP Diambil',
                icon: <PackageMinus className="w-4 h-4 text-purple-600" />,
                style: 'bg-purple-100 text-purple-800 border-purple-300',
            };
        case 'OUT_ASSET':
            return {
                label: 'Aset Dipinjam',
                icon: <ArrowUpRight className="w-4 h-4 text-orange-600" />,
                style: 'bg-orange-100 text-orange-800 border-orange-300',
            };
        case 'RETURN':
            return {
                label: 'Aset Dikembalikan',
                icon: <RefreshCcw className="w-4 h-4 text-blue-600" />,
                style: 'bg-blue-100 text-blue-800 border-blue-300',
            };
        default:
            return {
                label: type,
                icon: <Info className="w-4 h-4 text-gray-600" />,
                style: 'bg-gray-100 text-gray-800 border-gray-300',
            };
    }
};

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
    moment.locale('id');
    const { label, icon, style } = getStatusConfig(transaction.transaction_type);
    const unitName = transaction.unit?.name || 'Unit';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full transition-all hover:shadow-md relative">
            <div className="p-5 flex-grow space-y-4">
                
                {/* Header Card: Tipe Transaksi */}
                <div className="flex justify-between items-start gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                        {icon}
                        <span>{label}</span>
                    </div>
                </div>

                {/* Nama Barang & Barcode */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2" title={transaction.item?.name}>
                        {transaction.item?.name || "Barang Tidak Dikenal"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-mono">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{transaction.item?.barcode || "-"}</span>
                    </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Info Detail */}
                <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Tanggal Transaksi</p>
                            <span className="font-medium">{moment(transaction.created_at).format('DD MMM YYYY, HH:mm')}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <PackageMinus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Jumlah</p>
                            <span className="font-bold text-gray-900 text-base">{transaction.qty} {unitName}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Catatan</p>
                            <span className="text-sm italic text-gray-600 line-clamp-2">{transaction.note || "-"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Card: Info Kasir */}
            <div className="bg-gray-50 p-4 border-t flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4 text-gray-400" />
                <span>Diproses oleh: <b>{transaction.created_by_user?.nama_user || "-"}</b></span>
            </div>
        </div>
    );
};

export default TransactionCard;