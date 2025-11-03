"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/Table";
import Badge from "@/components/ui/badge/Badge";
import { endpointUrl, httpGet } from "@/../helpers";
import { FaUserEdit } from "react-icons/fa";
import EditAccessModal from "@/components/modal/edit/EditAccessModal";
import { useSearchParams } from "next/navigation";

interface SiteAccess {
    id: number;
    name: string;
    role_name?: string;
}
interface UserAccessItem {
    id_user: string;
    nama_user: string;
    email: string;
    role_garis: number;
    site_access: SiteAccess[];
}
interface Site {
    id_cab: number;
    nama_cab: string;
}
type BadgeColor =
    | "primary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "light"
    | "dark";

export default function UserAccessTable() {
    const [data, setData] = useState<UserAccessItem[]>([]);
    const [allSites, setAllSites] = useState<Site[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserAccessItem | null>(null);
    const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, last_page: 1 });
    const [searchTerm, setSearchTerm] = useState('');
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const page = searchParams.get("page") || "1";
    const getRoleInfo = (roleId: number): { name: string; color: BadgeColor } => {
        switch (roleId) {
            case 1: return { name: "Super Admin", color: "primary" };
            case 2: return { name: "Admin", color: "info" };
            case 3: return { name: "User", color: "warning" };
            default: return { name: "Unknown", color: "error" };
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };


    const columns = useMemo(() => [
        {
            id: "name",
            header: "Nama Pengguna",
            accessorKey: "nama_user",
            cell: ({ row }: any) => <span>{row.nama_user}</span>,
        },
        {
            id: "email",
            header: "Email",
            accessorKey: "email",
            cell: ({ row }: any) => <span>{row.email}</span>,
        },
        {
            id: "role_garis",
            header: "Peran",
            cell: ({ row }: any) => {
                const roleInfo = getRoleInfo(row.role_garis);
                return <Badge color={roleInfo.color}>{roleInfo.name}</Badge>;
            },
        },
        {
            id: "site",
            header: "Akses Cabang",
            cell: ({ row }: any) => {
                if (row.role_garis === 1) {
                    return <span className="text-sm italic text-gray-500">Akses Global</span>;
                }
                if (row.site_access.length === 0) {
                    return <span className="text-sm italic text-gray-500">-</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {row.site_access.map((site: any) => (
                            <Badge key={site.id} color="success">{site.name}</Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            id: "site_access",
            header: "Nama Peran Cabang",
            accessorKey: "site_access",
            cell: ({ row }: any) => <span>{row.site_access[0]?.role_name ?? "-"}</span>,
        },
        {
            id: "aksi",
            header: "Aksi",
            cell: ({ row }: any) => (
                <button
                    onClick={() => {
                        setSelectedUser(row);
                        setIsEditModalOpen(true);
                    }}
                    title="Edit Akses"
                    className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                >
                    <FaUserEdit className="w-4 h-4" />
                </button>
            ),
        },
    ], []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const search = searchTerm.trim();;
            const page = searchParams.get("page");
            const perPageParam = searchParams.get("per_page");

            const params: any = {
                ...(search ? { search } : {}),
                per_page: perPageParam ? Number(perPageParam) : perPage,
                page: page ? Number(page) : currentPage,
            };

            const [usersRes, sitesRes] = await Promise.all([
                httpGet(endpointUrl("user-access"), true, params),
                httpGet(endpointUrl("user-access/sites"), true)
            ]);

            setData(usersRes.data.data.data);
            setCount(usersRes.data.data.pagination.total);
            setLastPage(usersRes.data.data.pagination.total_pages);
            setAllSites(sitesRes.data.data);
        } catch (error) {
            toast.error("Gagal mengambil data akses pengguna.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchParams, currentPage, perPage, page, searchTerm]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama atau email..."
                    className="px-3 py-2 border border-gray-300 rounded-md"
                />
            </div>

            <Table
                data={data}
                columns={columns}
                loading={isLoading}
                pagination={true}
                lastPage={lastPage}
                total={count}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
            />

            <EditAccessModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchData}
                user={selectedUser}
                allSites={allSites}
            />
        </div>
    );
}