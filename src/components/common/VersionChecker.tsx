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
        const res = await fetch(`/api/version?t=${Date.now()}`);
        const data = await res.json();
        const serverBuildId = data.buildId;
        if (currentBuildId !== serverBuildId) {
          console.log(`Versi Baru Terdeteksi! Client: ${currentBuildId} -> Server: ${serverBuildId}`);
          if ('caches' in window) {
             try {
               const names = await caches.keys();
               await Promise.all(names.map(name => caches.delete(name)));
             } catch(e) { console.log(e) }
          }
          
          window.location.reload();
        }
      } catch (error) {
        console.error("Gagal cek versi:", error);
      }
    };

    checkVersion();

  }, [pathname]); 

  return null; 
}