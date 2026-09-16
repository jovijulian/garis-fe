"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { ChevronDownIcon, HorizontaLDots } from "../icons/index";
import Image from "next/image";
import { menuConfig, NavItem } from "@/config/menu-config";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [role, setRole] = useState<number | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const driverStatus = localStorage.getItem("is_driver");
    if (userRole) {
      setRole(parseInt(userRole, 10));
    }
    if (driverStatus) {
      setIsDriver(driverStatus === "true");
    }
  }, []);

  const activeNavItems = React.useMemo(() => {
    if (role === null) return [];
    let currentMenuKey: keyof typeof menuConfig | null = null;

    if (pathname.startsWith('/manage-booking')) {
      currentMenuKey = 'booking';
    } else if (pathname.startsWith('/orders')) {
      currentMenuKey = 'order';
    } else if (pathname.startsWith('/vehicles')) {
      currentMenuKey = 'vehicle';
    } else if (pathname.startsWith('/admin')) {
      currentMenuKey = 'admin';
    } else if (pathname.startsWith('/reminders')) {
      currentMenuKey = 'reminder';
    } else if (pathname.startsWith('/inventories')) {
      currentMenuKey = 'inventory';
    } else if (pathname.startsWith('/projects')) {
      currentMenuKey = 'project';
    } else if (pathname.startsWith('/reimbursements')) {
      currentMenuKey = 'reimbursement';
    } else if (pathname.startsWith('/profile')) {
      currentMenuKey = 'profile';
    } else if (pathname.startsWith('/portal-pelanggan')) {
      currentMenuKey = 'user';
    }

    if (!currentMenuKey) {
      return [];
    }
    const menu = menuConfig[currentMenuKey];
    const roleFilteredMenu = menu.filter(item => item.roles.includes(role));

    if (role === 3 && currentMenuKey === 'vehicle') {
      return roleFilteredMenu.filter(item => {
        if (isDriver) {
          return item.path !== '/vehicles/create' && item.path !== '/vehicles/my-requests';
        } else {
          return item.path !== '/vehicles/my-assignments';
        }
      });
    }
    return roleFilteredMenu;
  }, [pathname, role, isDriver]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = activeNavItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, activeNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type == menuType &&
        prevOpenSubmenu.index == index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-2">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {/* Divider line for "back to menu" items */}
          {nav.divider && (isExpanded || isHovered || isMobileOpen) && (
            <div className="my-2 mx-3 border-t border-gray-100 dark:border-gray-800" />
          )}
          {nav.divider && !(isExpanded || isHovered || isMobileOpen) && (
            <div className="my-2 mx-auto w-6 border-t border-gray-100 dark:border-gray-800" />
          )}

          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type == menuType && openSubmenu?.index == index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type == menuType && openSubmenu?.index == index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type == menuType &&
                    openSubmenu?.index == index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type == menuType && openSubmenu?.index == index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
             <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
    className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
      ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    onMouseEnter={() => !isExpanded && setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    
      <div className={`py-7 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <Image
              className="dark:hidden -mt-4"
              src="/images/logo-header.png"
              alt="Logo"
              width={140}
              height={36}
            />
          ) : (
            <Image
              src="/images/logo-header.png"
              alt="Logo"
              width={36}
              height={36}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-3 text-[11px] uppercase tracking-wider flex leading-[20px] text-gray-400 dark:text-gray-500 font-medium ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start pl-3"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Navigasi" : <HorizontaLDots />}
              </h2>
              {/* 4. Panggil renderMenuItems dengan `activeNavItems` */}
              {renderMenuItems(activeNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;