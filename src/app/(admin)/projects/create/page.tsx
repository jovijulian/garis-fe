import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import CreatePage from "./create";
import React from "react";

export const metadata: Metadata = {
    title: "Tambah Request Proyek",
};

export default function CreateProjectRequestForm() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Tambah Request Proyek" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
