"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; 
import { endpointUrl, httpGet } from "@/../helpers";
import { setCookie } from "cookies-next";
import { Loader2 } from "lucide-react";

const SSOHandler: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Memproses otentikasi...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      handleTokenProcessing(token);
    } else {
      setStatus("Token tidak ditemukan. Mengalihkan ke login...");
      setTimeout(() => {
        window.location.href = "/auth/login"; 
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTokenProcessing = async (token: string) => {
    try {
      localStorage.setItem("token", token);
      setCookie("cookieKey", token, {}); 

      await getMe();

    } catch (error) {
      console.error("SSO Error:", error);
      setStatus("Gagal memverifikasi sesi. Mengalihkan ke login...");
      localStorage.removeItem("token");
      
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const getMe = async () => {
    setStatus("Mengambil data pengguna...");
    const response = await httpGet(endpointUrl(`auth/me`), true); 
    const user = response.data.data;
    setCookie("role", user.role_id, {});
    localStorage.setItem("role", user.role_id);
    localStorage.setItem("name", user.name);
    localStorage.setItem("email", user.email);
    localStorage.setItem("id", user.id);
    if (user.role_id == "1" || user.role_id == "8") {
      window.location.href = "/menus";
    } else if (
      user.role_id == "2" ||
      user.role_id == "4" ||
      user.role_id == "6" ||
      user.role_id == "7"
    ) {
      window.location.href = "/dashboard";
    } else if (user.role_id == "3" || user.role_id == "5") {
      window.location.href = "/purchasing/dashboard";
    } else {
        window.location.href = "/menus";
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">Menghubungkan...</h2>
        <p className="text-slate-500 text-sm">{status}</p>
      </div>
    </div>
  );
};

export default SSOHandler;