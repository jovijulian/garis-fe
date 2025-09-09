// file: app/admin/user-access/_components/EditAccessModal.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { Modal } from '@/components/ui/modal';
import { endpointUrl, httpPut } from '@/../helpers';

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
interface EditAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: UserAccessItem | null;
    allSites: Site[];
}

export default function EditAccessModal({ isOpen, onClose, onSuccess, user, allSites }: EditAccessModalProps) {
    const [roleGaris, setRoleGaris] = useState<number>(3);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    // 1. Tambahkan state baru untuk role_name
    const [roleName, setRoleName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setRoleGaris(user.role_garis);
            if (user.site_access.length > 0) {
                setSelectedSiteId(String(user.site_access[0].id));
                setRoleName(user.site_access[0].role_name || '');
            } else {
                setSelectedSiteId('');
                setRoleName('');
            }
        }
    }, [user]);

 
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                role_garis: roleGaris,
                sites: roleGaris === 2 ? Number(selectedSiteId) || null : null,
                role_name: roleGaris === 2 ? (roleName.trim() || null) : null
            };
            await httpPut(endpointUrl(`user-access/${user?.id_user}`), payload, true);
            toast.success("Hak akses pengguna berhasil diperbarui.");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Gagal memperbarui hak akses.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
            <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold">Edit Akses: {user.nama_user}</h3>

                <div>
                    <label className="font-medium">Peran Dasar</label>
                    <select
                        value={roleGaris}
                        onChange={(e) => setRoleGaris(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded-md"
                    >
                        <option value={1}>Super Admin</option>
                        <option value={2}>Admin</option>
                        <option value={3}>User</option>
                    </select>
                </div>

                {/* Bagian ini hanya muncul jika peran adalah Admin */}
                {roleGaris === 2 && (
                    <div className="border-t pt-4 space-y-4">
                        {/* 3. Replace checkboxes with a single dropdown for the site */}
                        <div>
                            <label className="font-medium">Penugasan Situs</label>
                            <select
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md"
                            >
                                <option value="">-- Tidak Ada Situs Ditugaskan --</option>
                                {allSites.map(site => (
                                    <option key={site.id_cab} value={site.id_cab}>{site.nama_cab}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="font-medium">Role Name <span className="text-sm text-gray-500">(Opsional)</span></label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                placeholder="Contoh: admin-ga-bandung"
                                className="w-full mt-1 p-2 border rounded-md"
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border">Batal</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">
                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}