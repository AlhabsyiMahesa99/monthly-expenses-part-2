"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { LayoutDashboard, FileText, PawPrint, TrendingUp, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const base = pathname.split("/")[1] || "admin";
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const menu = [
    { label: "Dashboard", href: `/${base}/dashboard`, icon: LayoutDashboard },
    { label: "Data Transaksi", href: `/${base}/data-transaksi`, icon: FileText },
    { label: "Data Hewan", href: `/${base}/data-hewan`, icon: PawPrint },
    { label: "Laporan Penjualan", href: `/${base}/laporan-penjualan`, icon: TrendingUp },
  ];

  const handleLogout = async () => {
    setShowConfirm(false);
    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // delay animasi
      await supabase.auth.signOut(); // logout Supabase
      router.push("/login?logout=success"); // redirect ke login dengan flag sukses
    } catch (error) {
      console.error("Logout gagal:", error);
      alert("Terjadi kesalahan saat logout.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isLoggingOut && (
          <motion.aside
            initial={{ width: 320 }}
            animate={{ width: isCollapsed ? 90 : 320 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed top-0 left-0 z-50 h-screen flex flex-col bg-[#9D8F7F] text-white shadow-lg"
          >
            {/* Tombol toggle sidebar */}
            <div className="absolute -right-4 top-6 bg-[#9D8F7F] text-white rounded-full shadow-md hover:bg-[#8C7F70] transition">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Logo */}
            <div className="p-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!isCollapsed ? (
                  <motion.div
                    key="full-logo"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="w-52 h-44 relative"
                  >
                    <Image
                      src="/Logo2.png"
                      alt="Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mini-logo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 relative"
                  >
                    <Image
                      src="/Logo2.png"
                      alt="Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 relative">
              <ul className="space-y-2 mt-2">
                {menu.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon; // Ambil komponen icon

                  return (
                    <li
                      key={item.href}
                      className="relative"
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-base font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[#F5F2E8] text-[#111827]"
                            : "text-white hover:bg-[#F5F2E8] hover:text-[#111827]"
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />{" "}
                        {/* Render icon */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout di bawah */}
            <div className="p-4 border-t border-white/20">
              <button
                onClick={() => setShowConfirm(true)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md text-base font-medium transition-all duration-200 text-white hover:bg-[#F5F2E8] hover:text-[#111827] cursor-pointer`}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Logout
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Logout (pakai portal biar di tengah layar penuh) */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="bg-white text-black rounded-xl shadow-lg p-8 w-[300px] text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Anda yakin ingin logout?
                  </h2>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default Sidebar;
