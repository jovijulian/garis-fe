import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./create";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Buat Pengajuan Reimbursement",
};

export default function CreateReimbursementPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Formulir Pengajuan Reimbursement" />
            <IndexPage />
        </div>
    );
}
