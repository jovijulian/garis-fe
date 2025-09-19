import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { id } from 'date-fns/locale';

type FilterParams = {
    days?: string;
    period?: string;
    start_date?: string;
    end_date?: string;
};

const FilterComponent = ({
    onFilterChange,
    currentFilter
}: {
    onFilterChange: (params: FilterParams) => void;
    currentFilter: FilterParams;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activePeriod, setActivePeriod] = useState('30d');
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { days, period, start_date, end_date } = currentFilter;
        // START: Perubahan - Logika untuk mengenali 'today' dan 'yesterday'
        const today = moment().format('YYYY-MM-DD');
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

        if (start_date && end_date) {
            if (start_date === today && end_date === today) {
                setActivePeriod('today');
            } else if (start_date === yesterday && end_date === yesterday) {
                setActivePeriod('yesterday');
            } else {
                setActivePeriod('custom');
                setSelectedRange({
                    from: moment(start_date).toDate(),
                    to: moment(end_date).toDate()
                });
            }
        // END: Perubahan
        } else if (period) {
            setActivePeriod(period);
            setSelectedRange(undefined);
        } else if (days) {
            setActivePeriod(`${days}d`);
            setSelectedRange(undefined);
        } else {
            setActivePeriod('30d');
            setSelectedRange(undefined);
        }
    }, [currentFilter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePredefinedRange = (periodKey: string) => {
        setActivePeriod(periodKey);
        setSelectedRange(undefined);
        let params: FilterParams = {};

        // START: Perubahan - Tambahkan logika untuk 'today' dan 'yesterday'
        if (periodKey === 'today') {
            const today = moment().format('YYYY-MM-DD');
            params = { start_date: today, end_date: today };
        } else if (periodKey === 'yesterday') {
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
            params = { start_date: yesterday, end_date: yesterday };
        } 
        // END: Perubahan
        else if (periodKey.endsWith('d')) {
            params = { days: periodKey.replace('d', '') };
        } else {
            params = { period: periodKey };
        }
        
        onFilterChange(params);
        setIsOpen(false);
    };

    const handleApplyCustomRange = () => {
        if (selectedRange?.from && selectedRange?.to) {
            setActivePeriod('custom');
            onFilterChange({
                start_date: moment(selectedRange.from).format('YYYY-MM-DD'),
                end_date: moment(selectedRange.to).format('YYYY-MM-DD')
            });
            setIsOpen(false);
        }
    };

    const generateDisplayLabel = () => {
        if (activePeriod === 'custom' && selectedRange?.from && selectedRange?.to) {
            return `${moment(selectedRange.from).format('DD MMM YYYY')} - ${moment(selectedRange.to).format('DD MMM YYYY')}`;
        }
        const foundPeriod = periods.find(p => p.key === activePeriod);
        return foundPeriod ? foundPeriod.label : 'Pilih Rentang';
    };

    // START: Perubahan - Tambahkan 'Hari Ini' dan 'Kemarin' ke daftar
    const periods = [
        { key: 'today', label: 'Hari Ini' },
        { key: 'yesterday', label: 'Kemarin' },
        { key: '7d', label: '7 Hari Terakhir' },
        { key: '30d', label: '30 Hari Terakhir' },
        { key: '90d', label: '90 Hari Terakhir' },
        { key: 'month_to_date', label: 'Bulan Ini' },
        { key: 'last_month', label: 'Bulan Lalu' },
    ];
    // END: Perubahan

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-sm min-w-[280px] text-left"
            >
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span className="flex-1 text-gray-800 font-medium">{generateDisplayLabel()}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-auto animate-fade-in-up">
                    <div className="flex">
                        <div className="w-48 p-4 border-r border-gray-200 bg-gray-50 rounded-l-2xl">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Shortcut</h3>
                            <div className="space-y-1">
                                {periods.map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => handlePredefinedRange(p.key)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${activePeriod === p.key ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-white'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col p-3">
                            <DayPicker
                                mode="range"
                                selected={selectedRange}
                                onSelect={setSelectedRange}
                                numberOfMonths={1}
                                locale={id}
                                onDayClick={() => setActivePeriod('custom')}
                            />
                            <div className="flex justify-end mt-2 border-t border-gray-200 pt-3">
                                <button
                                    onClick={handleApplyCustomRange}
                                    disabled={!selectedRange?.from || !selectedRange?.to}
                                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                :global(.rdp) {
                    --rdp-cell-size: 36px;
                    --rdp-font-size: 0.875rem;
                    --rdp-caption-font-size: 1rem;
                    --rdp-accent-color: #2563eb;
                    --rdp-background-color: #dbeafe;
                    margin: 0;
                }
                :global(.rdp-caption_label) {
                    font-weight: 600;
                }
                :global(.rdp-nav_button) {
                    width: 36px;
                    height: 36px;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.2s ease-out;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default FilterComponent;