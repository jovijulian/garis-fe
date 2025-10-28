"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Briefcase,
    CalendarClock,
    Car,
    Package,
    ShieldCheck,
    FileText,
    ShoppingCart,
    Clock,
    Loader2,
} from "lucide-react";
import AppHeader from "@/layout/AppHeader";
import { endpointUrl, httpGet } from "../../../../helpers";
interface PendingCounts {
    pending_bookings: number;
    pending_vehicle_requests: number;
    pending_orders: number;
}

const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    gray: "bg-gray-500",
    indigo: "bg-indigo-500",
    pink: "bg-pink-500",
};

type ColorKey = keyof typeof colors;

const menuItems: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    href: string;
    color: ColorKey;

}[] = [
        {
            title: "Peminjaman Ruangan",
            description: "Booking dan kelola jadwal ruangan meeting.",
            icon: CalendarClock,
            href: "/manage-booking/dashboard",
            color: "blue",
        },
        {
            title: "Pengajuan Kendaraan",
            description: "Ajukan peminjaman kendaraan dan supir.",
            icon: Car,
            href: "/vehicles",
            color: "green",
        },
        {
            title: "Order",
            description: "Pantau dan atur pesanan dengan mudah.",
            icon: ShoppingCart,
            href: "/orders/dashboard",
            color: "indigo",
        },
        {
            title: "Inventaris",
            description: "Lihat dan pinjam inventaris kantor.",
            icon: Package,
            href: "/inventory",
            color: "yellow",
        },
        {
            title: "Pengajuan Proyek",
            description: "Kelola dan ajukan proyek baru.",
            icon: Briefcase,
            href: "/projects",
            color: "purple",
        },
        {
            title: "Pengingat",
            description: "Kelola pengingat penting Anda.",
            icon: CalendarClock,
            href: "/projects1",
            color: "pink",
        },
        {
            title: "Reimbursement",
            description: "Ajukan klaim reimbursement biaya.",
            icon: FileText,
            href: "/reimbursement",
            color: "red",
        },
        {
            title: "Admin Panel",
            description: "Kelola semua data (khusus super admin).",
            icon: ShieldCheck,
            href: "/admin-panel",
            color: "gray",
        },
    ];

interface MenuCardProps {
    title: string;
    description: string | React.ReactNode;
    icon: React.ComponentType<any>;
    href: string;
    color: ColorKey;
    userRole: string | null;
    isDriver: boolean;
    pendingCount?: number;
}

const MenuCard: React.FC<MenuCardProps> = ({
    title,
    description,
    icon: Icon,
    href,
    color,
    userRole,
    isDriver,
    pendingCount,
}) => {
    const isDisabled = title === "Admin Panel" && userRole !== "1";
    let dynamicHref = href;
    if (title === "Peminjaman Ruangan" && userRole === "3") {
        dynamicHref = "/manage-booking/my-bookings";
    }
    if (title === "Order" && userRole === "3") {
        dynamicHref = "/orders/my-orders";
    }

    if (title === "Pengajuan Kendaraan") {
        if (userRole === "3") {
            if (isDriver) {
                dynamicHref = "/vehicles/my-assignments";
            } else {
                dynamicHref = "/vehicles/my-requests";
            }
        } else {
            dynamicHref = "/vehicles/dashboard";
        }
    }
    const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isDisabled) {
            e.preventDefault(); 
        }
    };

    return (
        <Link href={dynamicHref} className="group block" onClick={handleCardClick} >
            <div
                className={`
      relative
      bg-white dark:bg-gray-800 rounded-2xl shadow p-6 h-full flex flex-col justify-between
      transition-all duration-300 border
      ${isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-xl hover:-translate-y-1'
                    }
    `}
            >
                {pendingCount !== undefined && pendingCount > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full  shadow-sm border border-red-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pendingCount} pending</span>
                    </div>
                )}
                <div>
                    <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${colors[color] ?? "bg-gray-500"
                            }`}
                    >
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mt-4">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {description}
                    </p>
                </div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Buka Menu →
                </div>
            </div>
        </Link>
    );
};

export default function MenusPage() {
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isDriver, setIsDriver] = useState(false);
    const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");
        const role = localStorage.getItem("role");
        const driver = localStorage.getItem("is_driver");
        if (name) setUserName(name);
        if (email) setUserEmail(email);
        if (role) setUserRole(role);
        if (driver) {
            setIsDriver(driver === "true");
        }
    }, []);
    useEffect(() => {
        if (userRole === "1" || userRole === "2") {
            fetchPendingCounts();
        }
    }, [userRole]);
    const fetchPendingCounts = async () => {
        setIsLoading(true);
        try {
            const response = await httpGet(
                endpointUrl("/dashboard/pending"),
                true
            );

            const data: PendingCounts = await response.data.data
            setPendingCounts(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching pending counts:", error);
        } finally {
            setIsLoading(false);
        }
    };
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen xl:flex-center">
            <div
                className={`flex-1 transition-all  duration-300 ease-in-out `}
            >
                <AppHeader />
                <div className="p-4 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                            Selamat Datang, {userName}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Silakan pilih menu yang ingin Anda akses di bawah ini.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item) => {
                            let countToShow: number | undefined = undefined;
                            if (pendingCounts) {
                                if (item.title === "Peminjaman Ruangan") {
                                    countToShow = pendingCounts.pending_bookings;
                                } else if (item.title === "Pengajuan Kendaraan") {
                                    countToShow = pendingCounts.pending_vehicle_requests;
                                } else if (item.title === "Order") {
                                    countToShow = pendingCounts.pending_orders;
                                }
                            }

                            return (
                                <MenuCard
                                    key={item.href}
                                    {...item}
                                    userRole={userRole}
                                    isDriver={isDriver}
                                    pendingCount={countToShow}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
