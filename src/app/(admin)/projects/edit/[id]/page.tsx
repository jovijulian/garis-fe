import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import EditPage from "./edit";
import React from "react";

export const metadata: Metadata = {
    title: "Ubah Request Proyek",
};

export default function EditProjectRequestForm() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Ubah Request Proyek" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <EditPage />
                </div>
            </div>
        </div>
    );
}
