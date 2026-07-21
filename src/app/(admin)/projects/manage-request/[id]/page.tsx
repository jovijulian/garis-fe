import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import DetailPage from "./detail";
import React from "react";

export const metadata: Metadata = {
    title: "Detail Request Proyek (Admin)",
};

export default function DetailProjectRequestAdminPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Detail Request Proyek" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <DetailPage />
                </div>
            </div>
        </div>
    );
}
