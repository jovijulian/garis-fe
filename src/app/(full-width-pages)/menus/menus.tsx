"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
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
    Lock,
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
    comingSoon?: boolean;
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
        comingSoon: true, 
    },
    {
        title: "Pengajuan Proyek",
        description: "Kelola dan ajukan proyek baru.",
        icon: Briefcase,
        href: "/projects",
        color: "purple",
        comingSoon: true, 
    },
    {
        title: "Pengingat",
        description: "Kelola pengingat penting Anda.",
        icon: CalendarClock,
        href: "/projects1",
        color: "pink",
        comingSoon: true, 
    },
    {
        title: "Reimbursement",
        description: "Ajukan klaim reimbursement biaya.",
        icon: FileText,
        href: "/reimbursement",
        color: "red",
        comingSoon: true, 
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
    isLoading?: boolean;
    onNavigate: (href: string) => void;
    isNavigating: boolean;
    index: number;
    mounted: boolean;
    comingSoon?: boolean;
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
    isLoading,
    onNavigate,
    isNavigating,
    index,
    mounted,
    comingSoon
}) => {
    const isRestrictedAdmin = title === "Admin Panel" && userRole !== "1";
    const isDisabled = isRestrictedAdmin || comingSoon;

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

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (comingSoon) {
            toast.info("Fitur ini sedang dalam pengembangan dan akan segera hadir!");
            return;
        }
        if (isRestrictedAdmin) {
            toast.error("Anda tidak memiliki akses ke menu ini.");
            return;
        }

        if (isNavigating) {
            return;
        }
        
        onNavigate(dynamicHref);
    };

    const shouldCheckPending =
        title === "Peminjaman Ruangan" ||
        title === "Pengajuan Kendaraan" ||
        title === "Order";

    return (
        <div
            onClick={handleCardClick}
            style={{ transitionDelay: `${index * 100}ms` }}
            className={`
                group block transform transition-all duration-700 ease-out relative
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <div
                className={`
                    relative
                    bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 h-full flex flex-col justify-between
                    transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden
                    ${isDisabled
                        ? 'opacity-80 bg-gray-50'
                        : 'hover:shadow-2xl hover:-translate-y-2 hover:border-blue-200 dark:hover:border-blue-900'
                    }
                    ${isNavigating && !isDisabled ? 'opacity-70 scale-95' : ''} 
                `}
            >
                {comingSoon && (
                    <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                        SEGERA HADIR
                    </div>
                )}
                
                {isRestrictedAdmin && (
                    <div className="absolute top-3 right-3 text-gray-400">
                        <Lock className="w-5 h-5" />
                    </div>
                )}

                {!isDisabled && isLoading && shouldCheckPending && (userRole === "1" || userRole === "2") ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 animate-pulse px-2.5 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div className="w-10 h-3 bg-gray-300 rounded"></div>
                    </div>
                ) : (
                    !isDisabled && pendingCount !== undefined && pendingCount > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm border border-red-700 animate-bounce">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{pendingCount} pending</span>
                        </div>
                    )
                )}

                <div>
                    <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 
                        ${isDisabled ? 'bg-gray-400 grayscale' : colors[color]} 
                        ${!isDisabled && ''}
                        `}
                    >
                        {isNavigating && !isDisabled ? (
                            <Loader2 className="w-7 h-7 text-white animate-spin" />
                        ) : (
                            <Icon className="w-7 h-7 text-white" />
                        )}
                    </div>
                    
                    <h3 className={`font-bold text-lg mt-5 transition-colors 
                        ${isDisabled ? 'text-gray-500' : 'text-gray-800 dark:text-white group-hover:text-blue-600'}
                    `}>
                        {title}
                    </h3>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                        {description}
                    </p>
                </div>

                {!isDisabled && (
                    <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 mt-5 opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Buka Menu <span className="ml-1">→</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function MenusPage() {
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isDriver, setIsDriver] = useState(false);
    const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
        } catch (error) {
            console.error("Error fetching pending counts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // const handleNavigation = (href: string) => {
    //     if (isNavigating) return;
    //     setIsNavigating(true);
    //     router.push(href);
    //     setTimeout(() => setIsNavigating(false), 5000);
    // };

    const handleNavigation = (href: string) => {
        if (isNavigating) return;
        setIsNavigating(true);

        window.location.href = href; 
        setTimeout(() => setIsNavigating(false), 5000);
    };

    return (
        <div className="min-h-screen xl:flex-center overflow-x-hidden">
            <div className={`flex-1 transition-all duration-300 ease-in-out`}>
                <AppHeader />
                <div className="p-4 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                    
                    <div className={`max-w-5xl mx-auto transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white tracking-tight">
                            Selamat Datang, <span className="text-blue-600">{userName}</span>!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                            Silakan pilih menu yang ingin Anda akses di bawah ini.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {menuItems.map((item, index) => {
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
                                    index={index}
                                    mounted={mounted}
                                    userRole={userRole}
                                    isDriver={isDriver}
                                    pendingCount={countToShow}
                                    isLoading={isLoading}
                                    onNavigate={handleNavigation}
                                    isNavigating={isNavigating}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}