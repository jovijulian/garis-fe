"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface CreateData {
    item_name: string;
    is_default: number;
}

export default function CreateForm() {
    const router = useRouter();
    const [itemName, setItemName] = useState("");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setLoading(true);
            const data: CreateData = {
                item_name: itemName,
                is_default: 0,
            }

            await httpPost(
                endpointUrl("/reimbursement-items"),
                data,
                true,
            );
            toast.success("Item Reimburse berhasil ditambahkan!");
            router.push("/reimbursements/items");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Gagal menambahkan Item Reimburse");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Data Item Reimburse">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Nama Item Reimburse<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/reimbursements/items")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menambahkan..." : "Tambahkan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}

