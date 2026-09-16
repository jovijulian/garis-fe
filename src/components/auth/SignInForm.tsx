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
        value.length < 4
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
      localStorage.setItem("sites", user.sites)
      localStorage.setItem("is_driver", user.is_driver)

      setCookie("role", user.role);
      setTimeout(() => {
        window.location.href = "/menus";
      }, 1000);

    } catch (error) {
      console.log(error);
    }
  };


  const renderAccountForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">USER ID HRIS</label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input id="nik" {...form.getInputProps("nik")} autoComplete="nik" type="text" placeholder="232009" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input {...form.getInputProps("password")} type={isPasswordVisible ? "text" : "password"} placeholder="Masukkan password" className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
            {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
  

  return (
    <div className="min-h-screen w-full flex items-center justify-center  bg-gradient-to-br from-slate-50 to-blue-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl flex flex-col md:flex-row bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/60 overflow-hidden">
      <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Logo & Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                <Image
                  src="/images/logo-header.png"
                  alt="Logo GARIS PT. Cisangkan"
                  width={140}
                  height={38}
                  priority
                  className="h-9 w-auto object-contain"
                />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Selamat Datang
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Silakan masuk menggunakan akun <span className="font-semibold text-slate-700">HRIS</span> Anda.
              </p>
            </div>

            {/* Error Alert */}
            {alert && (
              <div className="mb-5">
                <Alert
                  variant={alert.variant}
                  title={alert.title}
                  message={alert.message}
                  showLink={false}
                  linkHref=""
                  linkText=""
                />
              </div>
            )}

            {/* Form */}
            <form onSubmit={form.onSubmit(onSubmit)} className="space-y-4">
              {/* User ID HRIS */}
              <div>
                <label
                  htmlFor="nik"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  User ID HRIS
                </label>
                <div className="relative group">
                  <input
                    id="nik"
                    type="text"
                    autoComplete="username"
                    placeholder="Contoh: 221260"
                    {...form.getInputProps("nik")}
                    className={`w-full pl-4 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 bg-slate-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${
                      form.errors.nik
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-blue-500 hover:border-slate-300"
                    }`}
                  />
                </div>
                {form.errors.nik && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    {form.errors.nik}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    {...form.getInputProps("password")}
                    className={`w-full pl-4 pr-11 py-2.5 sm:py-3 text-sm text-slate-900 bg-slate-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${
                      form.errors.password
                        ? "border-rose-300 focus:border-rose-500"
                        : "border-slate-200 focus:border-blue-500 hover:border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {form.errors.password && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    {form.errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:from-blue-800 hover:to-indigo-800 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi akun...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center relative">
          <Image src="/images/ga-illustration.png" alt="Illustration of general affairr" fill style={{ objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
