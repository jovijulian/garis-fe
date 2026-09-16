import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-reimbursements";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Pengajuan Reimbursement Saya",
};

export default function MyReimbursementsPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Pengajuan Reimbursement Anda" />
            <IndexPage />
        </div>
    );
}
