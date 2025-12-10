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
          
            <h1 className="font-bold text-2xl text-slate-800 mt-4">Log in</h1>
            <p className="text-slate-500 text-sm">Silakan masuk menggunakan akun HRIS yang terdaftar.</p>
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
              {/* <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Lupa Password?
              </Link> */}
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
          <Image src="/images/ga-illustration.png" alt="Illustration of general affairr" fill style={{ objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
