"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpPost } from "@/../helpers";
import { toast } from "react-toastify";
import FileInput from "@/components/form/input/FileInput";
import DatePicker from "@/components/form/date-picker";

interface CreateData {
    email: string;
    name: string;
    phone: string;
    role: number | null;
}

export default function CreateForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState(2);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setLoading(true);
            const data: CreateData = {
                name,
                email,
                phone,
                role
            }

            await httpPost(
                endpointUrl("/users"),
                data,
                true,
            );
            toast.success("User added successfully!");
            router.push("/users");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Failed to add user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="User Data">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Name<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Phone<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="number"
                        defaultValue={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Email<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="email"
                        defaultValue={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={role === 1}
                            onChange={(e) => setRole(e.target.checked ? 1 : 2)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Is Admin?</span>
                    </label>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/users")}
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
                        {loading ? "Creating..." : "Add User"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}

