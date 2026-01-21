import React from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  Users,
  GitBranch,
  Home,
  FileText,
  Settings,
  School,
  LayoutList,
  GitPullRequestArrow,
  List,
  PlusCircle,
  Pin,
  Calendar,
  ShoppingCart,
  BaggageClaim,
  ClipboardList,
  UserCog,
  Truck,
  Settings2,
  CookingPot,
  Layers,
  BusFront
} from 'lucide-react';

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  roles: number[]; // 1: Super Admin, 2: Admin GA, 3: User
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, roles: number[] }[];
};

export const menuConfig: Record<string, NavItem[]> = {

  booking: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard />,
      path: '/manage-booking/dashboard',
      roles: [1, 2],
    },
    {
      name: 'Jadwal Peminjaman Ruangan',
      icon: <CalendarClock />,
      path: '/manage-booking/schedule',
      roles: [1, 2, 3],
    },
    {
      name: 'Pengajuan Booking',
      icon: <GitPullRequestArrow />,
      path: '/manage-booking',
      roles: [1, 2],
    },
    {
      name: 'Daftar Ruangan',
      icon: <School />,
      path: '/manage-booking/master/rooms',
      roles: [1, 2],
    },
    {
      name: 'Daftar Fasilitas',
      icon: <LayoutList />,
      path: '/manage-booking/master/facilities',
      roles: [1, 2],
    },
    {
      name: 'Daftar Topik',
      icon: <Pin />,
      path: '/manage-booking/master/topics',
      roles: [1, 2],
    },
    {
      name: 'Ajukan Booking',
      icon: <PlusCircle />,
      path: '/manage-booking/create-booking',
      roles: [3],
    },
    {
      name: 'Riwayat Pengajuan Booking',
      icon: <List />,
      path: '/manage-booking/my-bookings',
      roles: [3],
    },

    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1, 2, 3],
    }
  ],

  order: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard />,
      path: '/orders/dashboard',
      roles: [1, 2],
    },
    {
      name: 'List Pesanan Konsumsi',
      icon: <CookingPot />,
      path: '/orders/manage-order',
      roles: [1, 2],
    },
    {
      name: 'List Pesanan Akomodasi',
      icon: <BaggageClaim />,
      path: '/orders/manage-order-accommodation',
      roles: [1, 2],
    },
    {
      name: 'List Pesanan Transportasi',
      icon: <BusFront />,
      path: '/orders/manage-order-transport',
      roles: [1, 2],
    },
    {
      name: 'Daftar Tipe Konsumsi',
      icon: <LayoutList />,
      path: '/orders/master/consumption-types',
      roles: [1, 2],
    },
    {
      name: 'Daftar Jenis Transportasi',
      icon: <Layers />,
      path: '/orders/master/transport-types',
      roles: [1, 2],
    },
    {
      name: 'Buat Pesanan',
      icon: <PlusCircle />,
      path: '/orders/choose',
      roles: [3],
    },
    {
      name: 'Pesanan saya',
      icon: <ShoppingCart />,
      path: '/orders/my-orders',
      roles: [3],
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1, 2, 3],
    }
  ],

  vehicle: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard />,
      path: '/vehicles/dashboard',
      roles: [1, 2],
    },
    {
      name: 'List Pengajuan',
      icon: <ClipboardList />,
      path: '/vehicles/manage-requests',
      roles: [1, 2],
    },
    {
      name: 'Jadwal Keberangkatan',
      icon: <CalendarClock />,
      path: '/vehicles/schedule',
      roles: [1, 2, 3],
    },
    {
      name: 'Daftar Supir',
      icon: <UserCog />,
      path: '/vehicles/master/drivers',
      roles: [1, 2],
    },
    {
      name: 'Daftar Kendaraan',
      icon: <Truck />,
      path: '/vehicles/master/vehicles',
      roles: [1, 2],
    },
    {
      name: 'Master Jenis Kendaraan',
      icon: <Settings2 />,
      path: '/vehicles/master/vehicle-types',
      roles: [1, 2],
    },
    {
      name: 'Ajukan Peminjaman',
      icon: <PlusCircle />,
      path: '/vehicles/create',
      roles: [3],
    },
    {
      name: 'Riwayat Pengajuan Saya',
      icon: <List />,
      path: '/vehicles/my-requests',
      roles: [3],
    },
    {
      name: 'Penugasan Saya',
      icon: <Car />,
      path: '/vehicles/my-assignments',
      roles: [3],
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1, 2, 3],
    }
  ],

  admin: [
    {
      name: 'Manajemen Akses',
      icon: <Users />,
      path: '/admin-panel',
      roles: [1],
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1, 2, 3],
    }
  ],
  user: [
    {
      name: "Booking Saya",
      icon: <CalendarClock />,
      path: "/portal-pelanggan",
      roles: [3],
    },
    {
      name: "Buat Booking Baru",
      icon: <FileText />,
      path: "/portal-pelanggan/new",
      roles: [3],
    },
    {
      name: "Kembali ke Menu Utama",
      icon: <Home />,
      path: "/menus",
      roles: [1, 2, 3],
    }
  ],
};