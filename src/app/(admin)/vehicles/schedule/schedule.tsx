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
import VehicleScheduleGrid, { ScheduleData } from '@/components/schedule/VehicleScheduleGrid';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ReadonlyURLSearchParams } from 'next/navigation';
import MultiSelect from "@/components/form/MultiSelect-custom";

interface SelectOption { value: string; label: string; }

export default function ScheduleDisplayPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pageRef = useRef<HTMLDivElement>(null);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [role, setRole] = useState<string>('');
    const selectedDate = searchParams.get("date") || moment().format('YYYY-MM-DD');
    const selectedBranch = searchParams.get("cab_id") || '';
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
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
        if (selectedStatuses.length > 0) params.statuses = selectedStatuses.join(',');

        try {
            const response = await httpGet(endpointUrl("/vehicle-requests/schedule"), true, params);
            setScheduleData(response.data.data || { columns: [], bookings: [], timeSlots: [] });
            setLastUpdated(moment().format('HH:mm:ss'));
        } catch (err: any) {
            console.error(err);
            setError(`Gagal memuat jadwal (${err.message || 'Error Tidak Diketahui'})`);
            setScheduleData(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, selectedBranch, selectedStatuses]);

    const latestFetchSchedule = useRef(fetchSchedule);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        latestFetchSchedule.current = fetchSchedule;
    }, [fetchSchedule]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    useEffect(() => {
        const interval = setInterval(() => {
            latestFetchSchedule.current(false);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role) setRole(role);
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const updateQueryParams = (
        searchParams: ReadonlyURLSearchParams,
        router: AppRouterInstance,
        paramsToUpdate: Record<string, string | null | undefined>
    ) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(paramsToUpdate).forEach(([key, value]) => {
            if (value) {
                currentParams.set(key, value);
            } else {
                currentParams.delete(key);
            }
        });
        router.push(`?${currentParams.toString()}`, { scroll: false });
    };

    const handleBranchChange = (option: SelectOption | null) => {
        updateQueryParams(searchParams, router, {
            cab_id: option ? option.value : null
        });
    };

    const handleDateChange = (newDate: Date | null) => {
        updateQueryParams(searchParams, router, {
            date: newDate ? moment(newDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
        });
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

    const statusOptions = [
        { value: '', label: 'Semua Status' },
        { value: 'Approved', label: 'Approved' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Completed', label: 'Completed' },
    ];


    return (
        <div ref={pageRef} className="flex flex-col h-screen  ">
            <header className={`shadow-md rounded-lg bg-white p-3 sm:p-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-3 transition-all duration-300 ${isFullscreen ? 'hidden' : 'flex'}`}>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <h1 className="text-xl md:text-2xl font-bold  whitespace-nowrap">
                        Jadwal Keberangkatan
                        {selectedBranch && branchOptions.length > 1 && (
                            <span className="text-lg font-normal text-blue-300 ml-2">
                                ({_.find(branchOptions, { value: selectedBranch })?.label || ''})
                            </span>
                        )}
                    </h1>
                </div>

                <div className="
                    flex flex-col sm:flex-row 
                    items-stretch sm:items-center 
                    gap-3 sm:gap-2 
                    w-full sm:w-auto 
                    justify-end
                    ">
                    <div className="w-full sm:w-48">
                        {loadingBranches ? (
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <Select
                                options={branchOptions}
                                value={_.find(branchOptions, { value: selectedBranch })}
                                onValueChange={handleBranchChange}
                                placeholder="Pilih Cabang..."
                            />
                        )}
                    </div>

                    <div className="w-full sm:w-48">
                        <SingleDatePicker
                            placeholderText="Pilih Tanggal"
                            selectedDate={selectedDate ? new Date(selectedDate) : new Date()}
                            onChange={handleDateChange}
                            onClearFilter={() => handleDateChange(null)}
                            viewingMonthDate={viewingMonthDate}
                            onMonthChange={setViewingMonthDate}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <MultiSelect
                            placeholder="Pilih Status"
                            value={statusOptions.filter(opt => selectedStatuses.includes(opt.value))}
                            options={statusOptions}
                            onValueChange={(selectedOptions: { value: string, label: string }[]) => {
                                setSelectedStatuses(selectedOptions.map(opt => String(opt.value)));
                            }}
                        />

                    </div>

                    <div className="flex sm:block justify-end">
                        <button
                            onClick={() => fetchSchedule(false)}
                            disabled={isLoading}
                            className="p-2 text-gray-400  disabled:opacity-50"
                            data-tooltip-id="schedule-tooltip"
                            data-tooltip-content="Refresh Jadwal"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={toggleFullScreen}
                            className="p-2 text-gray-400 "
                            data-tooltip-id="schedule-tooltip"
                            data-tooltip-content={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

            </header>

            <main className="flex-grow overflow-hidden  shadow-inner rounded-lg relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-opacity-70 flex flex-col items-center justify-center z-10">
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
                {!isLoading && !error && (!scheduleData || scheduleData.columns.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <Car className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold">Tidak Ada Kendaraan</h3>
                        <p className="mt-1">
                            {selectedBranch
                                ? "Tidak ada kendaraan di cabang ini."
                                : "Tidak ada jadwal kendaraan untuk tanggal yang dipilih."
                            }
                        </p>
                    </div>
                )}

                {!error && scheduleData && scheduleData.columns.length > 0 && (
                    <VehicleScheduleGrid data={scheduleData} selectedDate={selectedDate} role={role} />
                )}
            </main>

            <footer className={`text-xs text-gray-500 text-center mt-2 transition-all duration-300 ${isFullscreen ? 'hidden' : 'block'}`}>
                Terakhir diperbarui: {lastUpdated || '-'} | GARIS - PT. Cisangkan
            </footer>
        </div>
    );
}