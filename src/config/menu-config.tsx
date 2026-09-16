import React from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  Users,
  Home,
  FileText,
  School,
  LayoutList,
  GitPullRequestArrow,
  List,
  PlusCircle,
  Pin,
  ShoppingCart,
  BaggageClaim,
  ClipboardList,
  UserCog,
  Truck,
  Settings2,
  CookingPot,
  Layers,
  BusFront,
  Bell,
  Tags,
  Boxes,
  Package,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  Sliders,
  FolderOpenDot,
  ArrowLeft,
} from 'lucide-react';

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  roles: number[]; // 1: Super Admin, 2: Admin GA, 3: User
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, roles: number[] }[];
  /** Visual separator — renders a thin divider line above this item */
  divider?: boolean;
};

export const menuConfig: Record<string, NavItem[]> = {

  booking: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/manage-booking/dashboard',
      roles: [1, 2],
    },
    {
      name: 'Jadwal Peminjaman Ruangan',
      icon: <CalendarClock className="w-[18px] h-[18px]" />,
      path: '/manage-booking/schedule',
      roles: [1, 2, 3],
    },
    {
      name: 'Pengajuan Booking',
      icon: <GitPullRequestArrow className="w-[18px] h-[18px]" />,
      path: '/manage-booking',
      roles: [1, 2],
    },
    {
      name: 'Daftar Ruangan',
      icon: <School className="w-[18px] h-[18px]" />,
      path: '/manage-booking/master/rooms',
      roles: [1, 2],
    },
    {
      name: 'Daftar Fasilitas',
      icon: <LayoutList className="w-[18px] h-[18px]" />,
      path: '/manage-booking/master/facilities',
      roles: [1, 2],
    },
    {
      name: 'Daftar Topik',
      icon: <Pin className="w-[18px] h-[18px]" />,
      path: '/manage-booking/master/topics',
      roles: [1, 2],
    },
    {
      name: 'Ajukan Booking',
      icon: <PlusCircle className="w-[18px] h-[18px]" />,
      path: '/manage-booking/create-booking',
      roles: [3],
    },
    {
      name: 'Riwayat Pengajuan Booking',
      icon: <List className="w-[18px] h-[18px]" />,
      path: '/manage-booking/my-bookings',
      roles: [3],
    },

    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],

  order: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/orders/dashboard',
      roles: [1, 2],
    },
    {
      name: 'List Pesanan Konsumsi',
      icon: <CookingPot className="w-[18px] h-[18px]" />,
      path: '/orders/manage-order',
      roles: [1, 2],
    },
    {
      name: 'List Pesanan Akomodasi',
      icon: <BaggageClaim className="w-[18px] h-[18px]" />,
      path: '/orders/manage-order-accommodation',
      roles: [1, 2],
    },
    {
      name: 'List Pesanan Transportasi',
      icon: <BusFront className="w-[18px] h-[18px]" />,
      path: '/orders/manage-order-transport',
      roles: [1, 2],
    },
    {
      name: 'Daftar Tipe Konsumsi',
      icon: <LayoutList className="w-[18px] h-[18px]" />,
      path: '/orders/master/consumption-types',
      roles: [1, 2],
    },
    {
      name: 'Daftar Jenis Transportasi',
      icon: <Layers className="w-[18px] h-[18px]" />,
      path: '/orders/master/transport-types',
      roles: [1, 2],
    },
    {
      name: 'Buat Pesanan',
      icon: <PlusCircle className="w-[18px] h-[18px]" />,
      path: '/orders/choose',
      roles: [3],
    },
    {
      name: 'Pesanan saya',
      icon: <ShoppingCart className="w-[18px] h-[18px]" />,
      path: '/orders/my-orders',
      roles: [3],
    },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],

  vehicle: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/vehicles/dashboard',
      roles: [1, 2],
    },
    {
      name: 'List Pengajuan',
      icon: <ClipboardList className="w-[18px] h-[18px]" />,
      path: '/vehicles/manage-requests',
      roles: [1, 2],
    },
    {
      name: 'Jadwal Keberangkatan',
      icon: <CalendarClock className="w-[18px] h-[18px]" />,
      path: '/vehicles/schedule',
      roles: [1, 2, 3],
    },
    {
      name: 'Daftar Supir',
      icon: <UserCog className="w-[18px] h-[18px]" />,
      path: '/vehicles/master/drivers',
      roles: [1, 2],
    },
    {
      name: 'Daftar Kendaraan',
      icon: <Truck className="w-[18px] h-[18px]" />,
      path: '/vehicles/master/vehicles',
      roles: [1, 2],
    },
    {
      name: 'Master Jenis Kendaraan',
      icon: <Settings2 className="w-[18px] h-[18px]" />,
      path: '/vehicles/master/vehicle-types',
      roles: [1, 2],
    },
    {
      name: 'Ajukan Peminjaman',
      icon: <PlusCircle className="w-[18px] h-[18px]" />,
      path: '/vehicles/create',
      roles: [3],
    },
    {
      name: 'Riwayat Pengajuan Saya',
      icon: <List className="w-[18px] h-[18px]" />,
      path: '/vehicles/my-requests',
      roles: [3],
    },
    {
      name: 'Penugasan Saya',
      icon: <Car className="w-[18px] h-[18px]" />,
      path: '/vehicles/my-assignments',
      roles: [3],
    },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],

  admin: [
    {
      name: 'Manajemen Akses',
      icon: <Users className="w-[18px] h-[18px]" />,
      path: '/admin-panel',
      roles: [1],
    },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],
  reminder: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/reminders/dashboard',
      roles: [1, 2],
    },
    {
      name: 'Data Pengingat',
      icon: <Bell className="w-[18px] h-[18px]" />,
      path: '/reminders/reminders',
      roles: [1, 2],
    },
    {
      name: 'Jenis Pengingat',
      icon: <Tags className="w-[18px] h-[18px]" />,
      path: '/reminders/reminder-types',
      roles: [1, 2],
    },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],
  inventory: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/inventories/dashboard',
      roles: [1, 2],
    },
    {
      name: 'Inbound',
      icon: <PackagePlus className="w-[18px] h-[18px]" />,
      path: '/inventories/stock-in',
      roles: [1, 2],
    },
    {
      name: 'Outbound',
      icon: <PackageMinus className="w-[18px] h-[18px]" />,
      path: '/inventories/stock-out',
      roles: [1, 2],
    },
    // {
    //   name: 'Pengajuan',
    //   icon: <FilePlus className="w-[18px] h-[18px]" />,
    //   path: '/inventories/create',
    //   roles: [3],
    // },
    {
      name: 'Pinjaman Saya',
      icon: <Package className="w-[18px] h-[18px]" />,
      path: '/inventories/my-loans',
      roles: [3],
    },
    {
      name: 'Riwayat',
      icon: <List className="w-[18px] h-[18px]" />,
      path: '/inventories/histories',
      roles: [3],
    },
    {
      name: 'Pengembalian',
      icon: <RotateCcw className="w-[18px] h-[18px]" />,
      path: '/inventories/returns',
      roles: [1, 2],
    },
    {
      name: 'Stock Opname',
      icon: <Sliders className="w-[18px] h-[18px]" />,
      path: '/inventories/stock-opname',
      roles: [1, 2],
    },
    {
      name: 'Riwayat Transaksi',
      icon: <FileText className="w-[18px] h-[18px]" />,
      path: '/inventories/transaction-logs',
      roles: [1, 2],
    },
    // {
    //   name: 'Data Barang',
    //   icon: <Package className="w-[18px] h-[18px]" />,
    //   path: '/inventories/items',
    //   roles: [1, 2],
    // },
    {
      name: 'Data Master',
      icon: <Boxes className="w-[18px] h-[18px]" />,
      path: '/inventories/items',
      roles: [1, 2],
      subItems: [
        { name: 'Barang', path: '/inventories/items', roles: [1, 2] },
        { name: 'Kategori Barang', path: '/inventories/master/categories', roles: [1, 2] },
        { name: 'Unit Barang (UOM)', path: '/inventories/master/units', roles: [1, 2] },
      ]
    },
    // {
    //   name: 'Kategori Barang',
    //   icon: <Tags className="w-[18px] h-[18px]" />,
    //   path: '/inventories/master/categories',
    //   roles: [1, 2],
    // },
    // {
    //   name: 'Unit Barang (UOM)',
    //   icon: <Boxes className="w-[18px] h-[18px]" />,
    //   path: '/inventories/master/units',
    //   roles: [1, 2],
    // },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],

  project: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/projects/dashboard',
      roles: [1, 2],
    },
    {
      name: 'List Pengajuan',
      icon: <ClipboardList className="w-[18px] h-[18px]" />,
      path: '/projects/manage-request',
      roles: [1, 2],
    },
    {
      name: 'Buat Pengajuan',
      icon: <PlusCircle className="w-[18px] h-[18px]" />,
      path: '/projects/create',
      roles: [3],
    },
    {
      name: 'Pengajuan saya',
      icon: <FolderOpenDot className="w-[18px] h-[18px]" />,
      path: '/projects/my-requests',
      roles: [3],
    },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],

  reimbursement: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      path: '/reimbursements/dashboard',
      roles: [1, 2],
    },
    {
      name: 'List Pengajuan',
      icon: <ClipboardList className="w-[18px] h-[18px]" />,
      path: '/reimbursements/manage-request',
      roles: [1, 2],
    },
    {
      name: 'Item Reimburse',
      icon: <Tags className="w-[18px] h-[18px]" />,
      path: '/reimbursements/items',
      roles: [1, 2],
    },
    {
      name: 'Buat Pengajuan',
      icon: <PlusCircle className="w-[18px] h-[18px]" />,
      path: '/reimbursements/create',
      roles: [3],
    },
    {
      name: 'Pengajuan saya',
      icon: <FolderOpenDot className="w-[18px] h-[18px]" />,
      path: '/reimbursements/my-reimbursements',
      roles: [3],
    },
    {
      name: 'Kembali ke Menu',
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: '/menus',
      roles: [1, 2, 3],
      divider: true,
    }
  ],

  user: [
    {
      name: "Booking Saya",
      icon: <CalendarClock className="w-[18px] h-[18px]" />,
      path: "/portal-pelanggan",
      roles: [3],
    },
    {
      name: "Buat Booking Baru",
      icon: <FileText className="w-[18px] h-[18px]" />,
      path: "/portal-pelanggan/new",
      roles: [3],
    },
    {
      name: "Kembali ke Menu",
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: "/menus",
      roles: [1, 2, 3],
      divider: true,
    }
  ],
  profile: [
    {
      name: "Akun Saya",
      icon: <UserCog className="w-[18px] h-[18px]" />,
      path: "/profile",
      roles: [1, 2, 3],
    },
    {
      name: "Kembali ke Menu",
      icon: <ArrowLeft className="w-[18px] h-[18px]" />,
      path: "/menus",
      roles: [1, 2, 3],
      divider: true,
    }
  ],
};