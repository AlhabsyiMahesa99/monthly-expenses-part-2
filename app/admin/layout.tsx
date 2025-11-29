"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePathname } from "next/navigation";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const hideSidebar = 
    pathname.includes("/data-transaksi/tambah") ||
    pathname.match(/\/data-transaksi\/\d+$/) ||
    pathname.match(/\/data-transaksi\/\d+\/edit$/);

  return (
    <div className="flex min-h-screen bg-[#F5F2E8] transition-all duration-300">
      {!hideSidebar && <Sidebar />}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          hideSidebar ? "ml-0" : isCollapsed ? "ml-[90px]" : "ml-[320px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // Ambil session user
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const user = session?.user;

      if (!user) {
        router.replace("/login"); // belum login
        return;
      }

      // Ambil role dari profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.replace("/login");
        return;
      }

      if (profile.role !== "admin") {
        router.replace("/staff/dashboard");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkUser();

    // Pantau perubahan auth real-time (biar gak bug pas login pertama)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-black">
        Loading...
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}