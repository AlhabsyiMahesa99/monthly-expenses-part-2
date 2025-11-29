"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../../public/Logo.png";
import UsernameField from "@/components/forms/UsernameField";
import EmailField from "@/components/forms/EmailField";
import PasswordField from "@/components/forms/PasswordField";
import loginHandler from "@/app/(auth)/loginHandler";
import registerHandler from "@/app/(auth)/registerHandler";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

const LoginClient: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const logoutSuccess = searchParams.get("logout") === "success";
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (logoutSuccess) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [logoutSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginHandler(username, password);
    if (result?.role === "admin") router.push("/admin/dashboard");
    else if (result?.role === "staff") router.push("/staff/dashboard");
    else alert("Login gagal! Cek email atau password");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await registerHandler(username, email, password);
    if (result?.success) {
      alert("Registrasi berhasil! Silakan login.");
      setIsRegister(false);
    } else {
      alert(result?.error || "Gagal registrasi");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8D6AD] overflow-hidden">
      <div className="relative w-[90%] max-w-4xl md:h-[600px] h-auto rounded-3xl shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
        <motion.div
          className="flex w-[200%] h-full"
          animate={{ x: isRegister ? "-50%" : "0%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Panel kiri - Login */}
          <div className="w-1/2 flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
              <h1 className="text-5xl font-bold text-center text-black mb-10">Sign In</h1>
              <form className="space-y-6" onSubmit={handleLogin}>
                <UsernameField value={username} onChange={(e) => setUsername(e.target.value)} />
                <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="w-full bg-[#007BFF] hover:bg-[#0066cc] text-white font-bold text-xl py-3 rounded-xl shadow-md transition duration-200 cursor-pointer">
                  Login
                </button>
              </form>
              <p className="text-center text-gray-700 mt-5">
                Belum punya akun?{" "}
                <button onClick={() => setIsRegister(true)} className="text-[#007BFF] font-medium hover:underline cursor-pointer">
                  Buat Akun
                </button>
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center w-1/2 bg-linear-to-br from-[#E8D6AD] to-[#f5e8c7]">
              <div className="relative w-[80%] h-[80%] drop-shadow-xl">
                <Image src={Logo} alt="Logo" fill className="object-contain" priority />
              </div>
            </div>
          </div>

          {/* Panel kanan - Register */}
          <div className="w-1/2 flex flex-col md:flex-row">
            <div className="hidden md:flex items-center justify-center w-1/2 bg-linear-to-br from-[#E8D6AD] to-[#f5e8c7]">
              <div className="relative w-[80%] h-[80%] drop-shadow-xl">
                <Image src={Logo} alt="Logo" fill className="object-contain" priority />
              </div>
            </div>
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
              <h1 className="text-5xl font-bold text-center text-black mb-10">Create Account</h1>
              <form className="space-y-6" onSubmit={handleRegister}>
                <UsernameField value={username} onChange={(e) => setUsername(e.target.value)} />
                <EmailField value={email} onChange={(e) => setEmail(e.target.value)} />
                <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="w-full bg-[#007BFF] hover:bg-[#0066cc] text-white font-bold text-xl py-3 rounded-xl shadow-md transition duration-200 cursor-pointer">
                  Sign Up
                </button>
              </form>
              <p className="text-center text-gray-700 mt-5">
                Sudah punya akun?{" "}
                <button onClick={() => setIsRegister(false)} className="text-[#007BFF] font-medium hover:underline cursor-pointer">
                  Masuk
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast sukses logout */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed top-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl text-lg font-semibold z-99999 flex items-center gap-3"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle className="w-6 h-6" />
            <span>Anda berhasil logout</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginClient;