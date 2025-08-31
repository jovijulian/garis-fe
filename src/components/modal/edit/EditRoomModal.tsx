"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import { alertToast, endpointUrl, httpGet, httpPatch, httpPost, httpPut } from "@/../helpers";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { useModal } from "@/hooks/useModal";

interface EditProps {
    isOpen: boolean;
    selectedId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditRoomModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const fetchRoomData = async () => {
            if (!selectedId) return;

            setIsLoading(true);
            setError("");
            try {
                const response = await httpGet(endpointUrl(`rooms/${selectedId}`), true);
                const roomData = response.data.data;

                setName(roomData.name || "");
                setDescription(roomData.description || "");

            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Failed to fetch room data.");
                setError("Could not load room data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchRoomData();
        } else {
            handleCancel();
        }
    }, [isOpen, selectedId]);
    const handleSubmit = async () => {
        setError("");

        const payload = {
            name,
            description
        };


        try {
            await httpPut(endpointUrl(`rooms/${selectedId}`), payload, true);
            toast.success("Room updated succesfully");
            setName("");
            setDescription("");
            onClose();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message);
            setError(error?.response?.data?.message || "Failed to change room.");
        }


    };
    const handleCancel = () => {
        onClose();
        setError("");
        setName("");
        setDescription("");
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                        Edit Room
                    </h4>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="space-y-5 px-2 pb-3">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Additional description..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <button
                            type="button"
                            title="Cancel"
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            title="Save"
                            className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default EditRoomModal;
