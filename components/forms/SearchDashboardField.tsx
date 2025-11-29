"use client";

import React, { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  onSearch?: (keyword: string) => void; // biar bisa dipakai di parent
}

const SearchDashboardField: React.FC<Props> = ({ onSearch }) => {
  const [role, setRole] = useState<string>(""); // untuk simpan role user
  const [keyword, setKeyword] = useState(""); // untuk input pencarian

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Ambil user aktif dari Supabase Auth
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!user) return;

        // Ambil role dari tabel profiles
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setRole(profile?.role || ""); // misal "admin" atau "staff"
      } catch (err) {
        console.error("Gagal ambil role user:", err);
      }
    };

    fetchUserRole();
  }, []);

  // Jalankan pencarian langsung saat ngetik
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (onSearch) onSearch(keyword.trim());
    }, 400); // kasih delay dikit biar ga spam query

    return () => clearTimeout(delayDebounce);
  }, [keyword]);

  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-center bg-white border border-black rounded-full px-6 py-2.5 w-full max-w-[950px] justify-between">
        {/* Search */}
        <div className="flex items-center w-full">
          <Search className="text-gray-500 mr-3" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="outline-none w-full bg-transparent text-base"
          />
        </div>

        {/* Garis Vertikal */}
        <div className="w-[1px] h-7 bg-black mx-4"></div>

        {/* User */}
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize">{role || "User"}</span>
          <User size={22} />
        </div>
      </div>
    </div>
  );
};

export default SearchDashboardField;
