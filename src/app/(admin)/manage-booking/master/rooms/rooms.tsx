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
import EditModal from "@/components/modal/edit/EditRoomModal";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import DateRangePicker from "@/components/common/DateRangePicker";

interface TableDataItem {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    amenities: [];
}


export default function RoomsPage() {
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
                header: "Name",
                accessorKey: "name",
                cell: ({ row }: any) => <span>{row.name}</span>,
            },
            {
                id: "description",
                header: "Description",
                accessorKey: "description",
                cell: ({ row }: any) => <span>{row.description}</span>,
            },
            {
                id: "nama_cab",
                header: "Cabang",
                accessorKey: "nama_cab",
                cell: ({ row }: any) => <span>{row.cabang?.nama_cab}</span>,
            },
            {
                id: "capacity",
                header: "Kapasitas",
                accessorKey: "capacity",
                cell: ({ row }: any) => <span>{row.capacity}</span>,
            },
            {
                id: "location",
                header: "Detail Lokasi",
                accessorKey: "location",
                cell: ({ row }: any) => <span>{row.location}</span>,
            },
            {
                id: "amenities",
                header: "Fasilitas pada ruangan",
                accessorKey: "amenities",
                cell: ({ row }: any) => {
                    const amenities = row.amenities;
                    return (
                        <span>
                            {amenities && amenities.length > 0
                                ? amenities.map((a: any) => a.name).join(", ")
                                : "-"}
                        </span>
                    );
                }
            },
            {
                id: "created_at",
                header: "Created At",
                accessorKey: "created_at",
                cell: ({ row }: any) => <span>{moment(row.created_at).format("DD MMM YYYY, HH:mm")}</span>,
            },
            {
                id: "updated_at",
                header: "Updated At",
                accessorKey: "updated_at",
                cell: ({ row }: any) => <span>{moment(row.updated_at).format("DD MMM YYYY, HH:mm")}</span>,
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
                endpointUrl("rooms"), true, params
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
                        onClick={() => router.push("/manage-booking/master/rooms/create")}
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
                url={`rooms/${selectedData?.id}`}
                itemName={selectedData?.name || ""}
                selectedData={selectedData}
                onSuccess={getData}
                message="Ruangan berhasil dihapus!"
            />

            <EditModal
                isOpen={isEditOpen}
                selectedId={selectedData?.id}
                onClose={() => setIsEditOpen(false)}
                onSuccess={getData}
            />
        </div>
    );
}
