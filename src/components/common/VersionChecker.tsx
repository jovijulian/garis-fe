"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function VersionChecker() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const currentBuildId = process.env.NEXT_PUBLIC_APP_BUILD_ID;
        
        // --- LOGGING DEBUGGING (Lihat di Console Browser) ---
        console.log("🔍 Cek Versi Berjalan...");
        console.log("👉 Client ID (Browser):", currentBuildId);

        const res = await fetch(`/api/version?t=${Date.now()}`);
        if (!res.ok) {
            console.error("❌ Gagal fetch API version:", res.status);
            return;
        }
        
        const data = await res.json();
        const serverBuildId = data.buildId;

        console.log("👉 Server ID (API):", serverBuildId);
        // ----------------------------------------------------

        if (currentBuildId && serverBuildId && currentBuildId !== serverBuildId) {
          console.warn(`⚠️ Versi Beda! Reloading... (${currentBuildId} -> ${serverBuildId})`);
          
          if ('caches' in window) {
             try {
               const names = await caches.keys();
               await Promise.all(names.map(name => caches.delete(name)));
             } catch(e) { console.log(e) }
          }
          
          window.location.reload();
        } else {
            console.log("✅ Versi Cocok / Aman.");
        }
      } catch (error) {
        console.error("❌ Error VersionChecker:", error);
      }
    };

    checkVersion();
  }, [pathname]);

  return null; 
}