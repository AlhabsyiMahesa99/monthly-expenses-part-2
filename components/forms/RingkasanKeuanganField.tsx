"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { supabase } from "@/lib/supabaseClient";

// 1) tambahkan index signature [key: string]: any agar kompatibel dengan ChartDataInput
interface DataItem {
  [key: string]: any;
  name: string;
  value: number;
  color: string;
}

const RingkasanKeuanganField: React.FC = () => {
  const [dataPie, setDataPie] = useState<DataItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: transaksi, error } = await supabase
          .from("transaksi")
          .select("jenis_transaksi, harga, jumlah");

        if (error) throw error;

        const totalPemasukan = transaksi
          ?.filter((t) => t.jenis_transaksi === "Pemasukan")
          .reduce((sum, t) => sum + (t.harga ?? 0) * (t.jumlah ?? 0), 0);

        const totalPengeluaran = transaksi
          ?.filter((t) => t.jenis_transaksi === "Pengeluaran")
          .reduce((sum, t) => sum + (t.harga ?? 0) * (t.jumlah ?? 0), 0);

        const totalLaba = (totalPemasukan ?? 0) - (totalPengeluaran ?? 0);

        const newData: DataItem[] = [
          { name: "Pemasukan", value: totalPemasukan ?? 0, color: "#27AE60" },
          { name: "Pengeluaran", value: totalPengeluaran ?? 0, color: "#E74C3C" },
          { name: "Laba Bersih", value: totalLaba, color: "#F1C40F" },
        ];

        setDataPie(newData);
      } catch (err) {
        console.error("Gagal ambil data ringkasan:", err);
      }
    };

    fetchData();
  }, []);

  const total = dataPie.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between flex-1 overflow-visible">
      <h2 className="font-semibold mb-2 text-left text-base">
        Ringkasan Keuangan
      </h2>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <ResponsiveContainer width="90%" height={190}>
            <PieChart>
              <Pie
                data={dataPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                labelLine={false}
                // 2) cast props.value ke number agar TS tidak complain
                label={(props: PieLabelRenderProps) => {
                  const {
                    cx = 0,
                    cy = 0,
                    midAngle = 0,
                    outerRadius = 0,
                  } = props;
                  // ambil value via any supaya typescript aman
                  const value = Number((props as any).value ?? 0);
                  const RADIAN = Math.PI / 180;
                  const radius = Number(outerRadius) * 0.6;
                  const x =
                    Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                  const y =
                    Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                  const percent = total > 0 ? (value / total) * 100 : 0;

                  if (!percent) return null;
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#fff"
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    >
                      {`${Math.round(percent)}%`}
                    </text>
                  );
                }}
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>

              {/* 3) tooltip formatter: gunakan any untuk parameter supaya TS tidak error */}
              <Tooltip
                formatter={(value: any, name: any) =>
                  `${name}: ${Number(value).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}`
                }
                wrapperStyle={{ zIndex: 50 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 ml-8">
          {dataPie.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-11 text-base font-semibold"
            >
              <span
                className="w-7 h-7 rounded-md inline-block mr-3"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="translate-x-[-30px] sm:translate-x-[-35px]">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RingkasanKeuanganField;