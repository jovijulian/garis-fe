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
    GitPullRequestArrow
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
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1, 2, 3],
    }
  ],

  vehicle: [
    {
      name: 'Dashboard Kendaraan',
      icon: <LayoutDashboard />,
      path: '/vehicles',
      roles: [1, 2],
    },
    {
      name: 'Daftar Supir',
      icon: <Users />,
      path: '/vehicles/drivers',
      roles: [1, 2],
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