"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { endpointUrl, httpGet } from '@/../helpers';
import moment from 'moment';
import 'moment/locale/id';
import {
    Loader2, AlertTriangle, Tv, Calendar as CalendarIcon, MapPin, Car, User, Users, RefreshCw, Maximize, Minimize, Building
} from 'lucide-react';
import Select from '@/components/form/Select-custom';
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import Badge from "@/components/ui/badge/Badge";
import _ from 'lodash';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify'


interface ScheduleItem {
    id: number;
    time: string;
    destination: string;
    purpose: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
    passengers: string;
    requester: string;
    vehicles: string;
    drivers: string;
}

interface SelectOption { value: string; label: string; }

export default function ScheduleDisplayPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pageRef = useRef<HTMLDivElement>(null);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [selectedBranch, setSelectedBranch] = useState<string>(searchParams.get("cab_id") || '');
    const [selectedDate, setSelectedDate] = useState<string>(searchParams.get("date") || moment().format('YYYY-MM-DD'));
    const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(true);

    const fetchBranches = useCallback(async () => {
        setLoadingBranches(true);
        try {
            const response = await httpGet(endpointUrl("/rooms/site-options"), true);
            const formatted = response.data.data.map((b: any) => ({ value: b.id_cab.toString(), label: b.nama_cab }));
            setBranchOptions([{ value: '', label: 'Semua Cabang' }, ...formatted]);
        } catch (err) { console.error("Failed to load branches:", err); setBranchOptions([{ value: '', label: 'Semua Cabang' }]); } finally { setLoadingBranches(false); }
    }, []);

    const fetchSchedule = useCallback(async (isInitialLoad = false) => {
        if (!isInitialLoad) setIsLoading(true);
        setError(null);
        const params: any = { date: selectedDate };
        if (selectedBranch) params.cab_id = selectedBranch;

        try {
            const response = await httpGet(endpointUrl("/vehicle-requests/schedule"), true, params);
            setSchedule(response.data.data || []);
            setLastUpdated(moment().format('HH:mm:ss'));
        } catch (err: any) {
            console.error(err);
            setError(`Gagal memuat jadwal (${err.message || 'Error Tidak Diketahui'})`);
            setSchedule([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, selectedBranch]);

    useEffect(() => {
        fetchBranches();
        fetchSchedule(true);

        const intervalId = setInterval(() => fetchSchedule(false), 60000);
        return () => clearInterval(intervalId);
    }, [fetchBranches]);

    const updateUrlParams = useCallback(_.debounce((date, branch) => {
        const params = new URLSearchParams();
        params.set('date', date);
        if (branch) params.set('cab_id', branch);
        router.replace(`?${params.toString()}`, { scroll: false });
        fetchSchedule(false);
    }, 500), [router, fetchSchedule]);

    useEffect(() => {
        updateUrlParams(selectedDate, selectedBranch);
    }, [selectedBranch, selectedDate, updateUrlParams]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    const handleBranchChange = (option: SelectOption | null) => {
        setSelectedBranch(option ? option.value : '');
    };
    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'));
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            pageRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                toast.error("Gagal masuk mode layar penuh.");
            });
        } else {
            document.exitFullscreen();
        }
    };
    const getStatusBadge = (status: string) => {
        let color: "success" | "error" | "warning" | "info";
        let label = status;
        switch (status) {
            case 'Approved': color = 'success'; label = 'Approved'; break;
            case 'Rejected': color = 'error'; label = 'Rejected'; break;
            case 'Canceled': color = 'error'; label = 'Canceled'; break;
            case 'In Progress': color = 'info'; label = 'In Progress'; break;
            case 'Completed': color = 'success'; label = 'Completed'; break;
            case 'Submit': color = 'warning'; label = 'Submit'; break;
            default: color = 'info'; break;
        }
        return <Badge color={color} >{label}</Badge>;
    };

    return (
        <div ref={pageRef} className="flex flex-col h-screen bg-gray-900  p-4 sm:p-6 lg:p-8">
            <header className={`bg-gray-800 shadow-md rounded-lg p-3 sm:p-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-3 transition-all duration-300 ${isFullscreen ? 'hidden' : 'flex'}`}>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-100 whitespace-nowrap">
                        Jadwal Keberangkatan
                        {selectedBranch && branchOptions.length > 1 && (
                            <span className="text-lg font-normal text-blue-300 ml-2">
                                ({_.find(branchOptions, { value: selectedBranch })?.label || ''})
                            </span>
                        )}
                    </h1>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <div className="w-40 sm:w-48 ">
                        {branchOptions.length > 0 && (
                            <Select
                                options={branchOptions}
                                value={_.find(branchOptions, { value: selectedBranch })}
                                onValueChange={handleBranchChange}
                                placeholder="Pilih Cabang..."
                            />
                        )}
                    </div>
                    <div className="w-40 sm:w-48">
                        <SingleDatePicker
                            placeholderText="Pilih Tanggal"
                            selectedDate={selectedDate ? new Date(selectedDate) : new Date()}
                            onChange={(date: any) => handleDateChange(date)}
                            onClearFilter={() => setSelectedDate(moment().format('YYYY-MM-DD'))}
                            viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} />
                    </div>
                    
                    <button
                        onClick={() => fetchSchedule(false)}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
                        data-tooltip-id="schedule-tooltip"
                        data-tooltip-content="Refresh Jadwal"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-400 hover:text-white"
                        data-tooltip-id="schedule-tooltip"
                        data-tooltip-content={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-hidden bg-gray-850 shadow-inner rounded-lg relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                        <p className="text-gray-300 text-sm">Memperbarui jadwal...</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
                        <AlertTriangle className="w-10 h-10 mb-3" />
                        <p className="font-semibold">Terjadi Kesalahan</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {!isLoading && !error && schedule.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <CalendarIcon className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold">Tidak Ada Jadwal</h3>
                        <p className="mt-1">Tidak ada jadwal kendaraan untuk tanggal dan cabang yang dipilih.</p>
                    </div>
                )}

                {!error && schedule.length > 0 && (
                    <div className="h-full overflow-y-auto">
                        
                        <table className="w-full table-fixed text-left text-gray-200">
                            
                            <thead className="text-sm text-gray-300 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3 w-[8%] text-center">Waktu</th>
                                    <th scope="col" className="px-4 py-3 w-[20%]">Tujuan</th>
                                    <th scope="col" className="px-4 py-3 w-[15%]">Kendaraan</th>
                                    <th scope="col" className="px-4 py-3 w-[15%]">Supir</th>
                                    <th scope="col" className="px-4 py-3 w-[15%]">Pemohon</th>
                                    <th scope="col" className="px-4 py-3 w-[10%] text-center">Penumpang</th>
                                    <th scope="col" className="px-4 py-3 w-[20%]">Keperluan</th>
                                    <th scope="col" className="px-4 py-3 w-[12%] text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-base">
                                {schedule.map((item, index) => (
                                    <tr key={item.id} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'} hover:bg-gray-750`}>
                                        <td className="px-4 py-4 font-bold text-lg text-center text-white">{item.time}</td>
                                        <td className="px-4 py-4 font-medium text-white truncate" title={item.destination}>{item.destination}</td>
                                        <td className="px-4 py-4 whitespace-pre-wrap text-gray-300 leading-tight">{item.vehicles}</td>
                                        <td className="px-4 py-4 whitespace-pre-wrap text-gray-300 leading-tight">{item.drivers}</td>
                                        <td className="px-4 py-4 whitespace-pre-wrap text-gray-300 leading-tight">{item.requester}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span data-tooltip-id="schedule-tooltip" data-tooltip-html={item.passengers.replace(/\n/g, '<br />') || 'Tidak ada'} className="cursor-default">
                                                {item.passengers?.split('\n')[0].split(',').length ?? 0} {/* Show count */}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-400 text-sm truncate" title={item.purpose}>{item.purpose}</td>
                                        <td className="px-4 py-4 text-center">{getStatusBadge(item.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Tooltip id="schedule-tooltip" />
                    </div>
                )}
            </main>

            <footer className={`text-xs text-gray-500 text-center mt-2 transition-all duration-300 ${isFullscreen ? 'hidden' : 'block'}`}>
                Terakhir diperbarui: {lastUpdated || '-'} | GARIS - PT. Cisangkan
            </footer>
        </div>
    );
}