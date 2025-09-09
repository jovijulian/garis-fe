"use client";
import React, { useState } from "react";
import { IconEye, IconEyeOff, IconMail, IconMessage, IconStar } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import { Root } from "@/types";
import { useForm } from "@mantine/form";
import { endpointUrl, endpointUrlv2, httpGet } from "@/../helpers";
import { BiSolidCarMechanic } from "react-icons/bi";

import useLocalStorage from "@/hooks/useLocalStorage";
import { setCookie } from "cookies-next";
import Alert from "@/components/ui/alert/Alert";
import axios from "axios";
import { useParams } from 'next/navigation';
import { Metadata } from "next";
import { toast } from "react-toastify";
import { FaCog, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser, FaWrench } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";
import { jwtDecode } from "jwt-decode";
import { AtSign, Eye, EyeOff, IdCard, Key, Loader2 } from "lucide-react";

const SignIn: React.FC = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [_, setToken] = useLocalStorage("token", "");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ variant: any; title: string; message: string; showLink: boolean; linkHref: string; linkText: string } | null>(null);

  const form = useForm({
    initialValues: {
      nik: "",
      password: "",
    },
    validate: {
      password: (value: any) =>
        value.length < 6
          ? "Password should include at least 6 characters"
          : null,
    },
  });

  const onSubmit = async (payload: typeof form.values) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await axios<Root>({
        method: "POST",
        url: endpointUrl(`auth/login`),
        data: {
          id_user: form.values.nik,
          password: form.values.password,
        },
      });

      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      setCookie("cookieKey", token, {});
      getMe();
    } catch (error) {
      console.log(error);
      setAlert({
        variant: "error",
        title: "Login Gagal",
        message: "ID User atau password salah.",
        showLink: false,
        linkHref: "",
        linkText: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMe = async () => {
    try {
      const response = await httpGet(endpointUrl(`auth/me`), true);
      const user = response.data.data;
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("id_user", user.id_user);

      setCookie("role", user.role);
      console.log(user)

      if (user.role == 1) {
        window.location.href = "/";
      } else if (user.role == 2) {
        window.location.href = "/booking";
      }
    } catch (error) {
      console.log(error);
    }
  };


  const renderAccountForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">NIK (6 Digit Terakhir)</label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input {...form.getInputProps("nik")} type="text" placeholder="232009" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input {...form.getInputProps("password")} type={isPasswordVisible ? "text" : "password"} placeholder="Masukkan password" className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
            {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="flex items-center">
              <svg viewBox="10 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 sm:h-10 text-blue-600">
                <path d="M27.3546 3.1746C21.7442 3.1746 16.7856 5.96385 13.7915 10.2305L10.4399 9.56057C13.892 3.83178 20.1756 0 27.3546 0C34.5281 0 40.8075 3.82591 44.2613 9.54743L40.9084 10.2176C37.9134 5.95821 32.9593 3.1746 27.3546 3.1746Z" fill="currentColor" />
                <path d="M17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194Z" fill="currentColor" />
              </svg>
              <span className="text-gray-800 dark:text-white font-bold text-xl sm:text-2xl">GARIS</span>
            </Link>
            <h1 className="font-bold text-2xl text-slate-800 mt-4">Log in</h1>
            <p className="text-slate-500 text-sm">Silakan masuk menggunakan akun yang terdaftar.</p>
          </div>

          <form onSubmit={form.onSubmit(onSubmit)} className="space-y-5">
            {renderAccountForm()}
            {alert && (
              <Alert variant={alert.variant} title={alert.title} message={alert.message} showLink={false} linkHref="" linkText="" />
            )}

            <div className="flex items-center justify-between text-sm">
              {/* <button type="button" onClick={() => setLoginMethod(loginMethod === 'account' ? 'meter' : 'account')} className="text-blue-600 hover:underline font-medium">
                {loginMethod === 'account' ? 'Login dengan Nomor Meter' : 'Login dengan Akun'}
              </button> */}
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Lupa Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-blue-300"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>

        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center relative">
          <Image src="/images/ga-illustration.png" alt="Illustration of general affair" fill style={{ objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
