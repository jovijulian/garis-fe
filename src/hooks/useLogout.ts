"use client";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpPost } from "@/../helpers";
import { deleteCookie } from "cookies-next";

export default function useLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await httpPost(endpointUrl("auth/logout"), "", true);
      localStorage.clear();
      deleteCookie("cookieKey");
      deleteCookie("role");
      router.push("/signin");
    } catch (error: any) {
      const message = error.response?.data?.message || "An error occurred";
      alertToast("error", message);
    }
  };
  return { handleLogout };
}
