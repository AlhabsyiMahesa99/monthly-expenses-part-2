"use client";

import React, { useEffect, useState } from "react";
import FilterSearchAnimalField, { Filters } from "@/components/forms/FilterSearchAnimalField";
import AnimalDataField from "@/components/forms/AnimalDataField";
import { supabase } from "@/lib/supabaseClient";

interface CardData {
  title: string;
  count: number;
  bg: string;
}

const Page = () => {
  const [data, setData] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  // Filter
  const [filters, setFilters] = useState<Filters>({ search: "", jenis: "", status: "", user: "" });

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const { data: result, error } = await supabase
        .from("hewan")
        .select("jenis, id");

      if (error) {
        console.error("❌ Gagal ambil data:", error.message);
        setLoading(false);
        return;
      }

      // Hitung jumlah tiap jenis
      const grouped = result.reduce((acc: Record<string, number>, curr) => {
        acc[curr.jenis] = (acc[curr.jenis] || 0) + 1;
        return acc;
      }, {});

      const formatted: CardData[] = [
        { title: "Kambing", count: grouped["Kambing"] || 0, bg: "bg-white" },
        { title: "Sapi", count: grouped["Sapi"] || 0, bg: "bg-white" },
        { title: "Domba", count: grouped["Domba"] || 0, bg: "bg-white" },
      ];

      setData(formatted);
      setLoading(false);
    };

    fetchCounts();
  }, []);

  return (
    <div className="p-6 text-black">
      <h1 className="text-3xl font-bold mb-6">Data Hewan</h1>

      {/* Card Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-center col-span-3 py-4 text-gray-500">Loading...</p>
        ) : (
          data.map((item, index) => (
            <div
              key={index}
              className={`${item.bg} flex flex-col items-center justify-center rounded-xl shadow-sm py-8 hover:scale-[1.02] transition-transform duration-300`}
            >
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-5xl font-bold">{item.count}</p>
            </div>
          ))
        )}
      </div>

      {/* Filter & Search Section */}
      <div className="mt-6">
        <FilterSearchAnimalField onApply={(f) => setFilters(f)} />
      </div>

      {/* Animal Data Section */}
      <div className="mt-6">
        <AnimalDataField filters={filters} />
      </div>
    </div>
  );
};

export default Page;