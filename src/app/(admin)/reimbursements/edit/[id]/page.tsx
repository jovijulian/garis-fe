import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./edit";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Ubah Pengajuan Reimbursement",
};

export default function EditReimbursementPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Ubah Pengajuan Reimbursement" />
            <IndexPage />
        </div>
    );
}
