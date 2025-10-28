"use client";

import Table from "@/components/tables/Table";
import { Metadata } from "next";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import { alertToast, endpointUrl, httpDelete, httpGet } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import EditModal from "@/components/modal/edit/EditVehicleModal";
import EditStatusModal from "@/components/modal/edit/EditVehicleStatusModal";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import DateRangePicker from "@/components/common/DateRangePicker";

interface TableDataItem {
    id: number;
    name: string;
    license_plate: string;
    vehicle_type: { id: number; name: string; };
    passenger_capacity: number;
    status: string;
    is_active: boolean;
    cabang: { id_cab: number; nama_cab: string; };
    created_at: string;
    is_operational: boolean;
}


export default function VehiclesPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [selectedRows, setSelectedRows] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState<TableDataItem | null>(null);
    const [deleteData, setDeleteData] = useState<TableDataItem | null>(null);
    const router = useRouter()
    const page = searchParams.get("page") || "1";
    const [data, setData] = useState<TableDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedData, setSelectedData] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    useEffect(() => {
        getData();
    }, [searchParams, currentPage, perPage, page, searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };


    const columnsNew = useMemo(() => {
        const defaultColumns = [
            {
                id: "action",
                header: "Aksi",
                accessorKey: "action",
                cell: ({ row }: any) => {
                    return (
                        <div className="flex items-center gap-2">
                            {/* Edit */}
                            <button
                                onClick={() => {
                                    setSelectedData(row);
                                    setIsEditOpen(true);
                                }}
                                title="Edit"
                                className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                            >
                                <FaEdit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => {
                                    setSelectedData(row);
                                    setIsDeleteModalOpen(true);
                                }}
                                title="Delete"
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        </div>
                    );
                },
                minWidth: "50px",
                maxWidth: "70px",
            },
            {
                id: "name",
                header: "Merk",
                accessorKey: "name",
                cell: ({ row }: any) => <span>{row.name}</span>,
            },
            {
                id: "license_plate",
                header: "Plat Nomor",
                accessorKey: "license_plate",
                cell: ({ row }: any) => <span>{row.license_plate}</span>,
            },
            {
                id: "vehicle_type.name",
                header: "Jenis Kendaraan",
                accessorKey: "vehicle_type.name",
                cell: ({ row }: any) => <span>{row.vehicle_type?.name}</span>,
            },
            {
                id: "cabang.name",
                header: "Cabang",
                accessorKey: "cabang.name",
                cell: ({ row }: any) => <span>{row.cabang.nama_cab}</span>,
            },
            {
                id: "passenger_capacity",
                header: "Kapasitas",
                accessorKey: "passenger_capacity",
                cell: ({ row }: any) => <span>{row.passenger_capacity}</span>,
            },
            {
                id: "is_operational",
                header: "Operasional",
                accessorKey: "is_operational",
                cell: ({ row }: any) => <span>{row.is_operational == 1 ? 'Ya' : 'Tidak'}</span>,
            },
            {
                id: "status",
                header: "Status",
                accessorFn: (row: any) => row.status,
                cell: ({ row }: { row: any }) => {
                    const status = row.status;
                    const color = status === 'Available' ? 'success' : status === 'Not Available' ? 'error' : 'warning';

                    return (
                        <button
                            onClick={() => {
                                setSelectedData(row);
                                setIsStatusModalOpen(true);
                            }}
                            className="transition-transform duration-200 hover:scale-105 cursor-pointer"
                            title="Klik untuk Ubah Status"
                        >
                            <Badge color={color}>{status}</Badge>
                        </button>
                    );
                },
            },
            {
                id: "created_at",
                header: "Dibuat pada",
                accessorKey: "created_at",
                cell: ({ row }: any) => <span>{moment(row.created_at).format("DD-MM-YYYY")}</span>,
            },
        ];
        return [...defaultColumns, ...columns.filter((col) => col.field !== "id" && col.field !== "hide_this_column_field")];
    }, [columns]);

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();;
        const page = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");

        const params: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: page ? Number(page) : currentPage,
        };


        try {
            const response = await httpGet(
                endpointUrl("vehicles"), true, params
            );

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.pagination.total);
            setLastPage(response.data.data.pagination.total_pages);
        } catch (error) {
            console.log(error)
            toast.error("Failed to fetch data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    return (
        <div className="space-y-4">

            {/* Action Buttons */}
            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />

                    <button
                        onClick={() => router.push("/vehicles/master/vehicles/create")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>+</span>
                        Tambah
                    </button>
                    {/* {selectedRows.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            Delete Selected ({selectedRows.length})
                        </button>
                    )} */}
                </div>
            </div>

            {/* Table */}
            <Table
                data={data}
                columns={columnsNew}
                pagination={true}
                // selection={true}
                lastPage={lastPage}
                total={count}
                loading={isLoading}
                checkedData={selectedRows}
                setCheckedData={setSelectedRows}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}

            />

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedData(null);
                }}
                url={`vehicles/${selectedData?.id}`}
                itemName={`${selectedData?.name} (${selectedData?.license_plate})` || ""}
                selectedData={selectedData}
                onSuccess={getData}
                message="Kendaraan berhasil dihapus!"
            />

            <EditModal
                isOpen={isEditOpen}
                selectedId={selectedData?.id}
                onClose={() => setIsEditOpen(false)}
                onSuccess={getData}
            />
            {selectedData && (
                <EditStatusModal
                    isOpen={isStatusModalOpen}
                    onClose={() => {
                        setIsStatusModalOpen(false);
                        setSelectedData(null);
                    }}
                    onSuccess={() => {
                        setIsStatusModalOpen(false);
                        setSelectedData(null);
                        getData();
                    }}
                    vehicleData={selectedData}
                />
            )}
        </div>
    );
}
