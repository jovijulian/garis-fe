import type { Metadata } from "next";
import React from "react";
import ReimbursementDashboard from "./dashboard";

export const metadata: Metadata = {
  title: "Dashboard Reimbursement | GARIS PT. Cisangkan",
};

export default function ReimbursementsDashboardPage() {
  return <ReimbursementDashboard />;
}
