"use client";

import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

export type TransaksiFilters = {
  search: string; // ID transaksi / nama pihak
  jenis: string; // jenis hewan
  range: string; // rentang tanggal
  user: string; // user input
};

interface Props {
  onApply?: (filters: TransaksiFilters) => void;
}

const FilterSearchField: React.FC<Props> = ({ onApply }) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>(["", "", ""]);
  const [searchText, setSearchText] = useState("");

  const dropdowns = [
    { label: "Jenis Hewan", options: ["", "Sapi", "Kambing", "Domba"] },
    {
      label: "Rentang Tanggal",
      options: ["", "1 Hari Terakhir", "7 Hari Terakhir", "30 Hari Terakhir"],
    },
    { label: "User Input", options: ["", "admin", "staff"] },
  ];

  const apply = () => {
    onApply?.({
      search: searchText.trim(),
      jenis: selectedValues[0] || "",
      range: selectedValues[1] || "",
      user: selectedValues[2] || "",
    });
  };

  const reset = () => {
    setSearchText("");
    setSelectedValues(["", "", ""]);
    onApply?.({ search: "", jenis: "", range: "", user: "" });
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Cari Id Transaksi / Nama Pihak"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="w-full border border-gray-300 rounded-md py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute right-3 top-2.5 text-gray-500 w-5 h-5" />
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap lg:flex-nowrap">
        {dropdowns.map((dropdown, index) => (
          <div key={index} className="relative w-full sm:w-auto z-20">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === index ? null : index)
              }
              className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <span className="whitespace-nowrap">
                {selectedValues[index] || dropdown.label}
              </span>
              {openDropdown === index ? (
                <ChevronUp size={18} className="text-gray-500" />
              ) : (
                <ChevronDown size={18} className="text-gray-500" />
              )}
            </button>

            <div
              className={`absolute left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md overflow-auto transform transition-all duration-150 origin-top ${
                openDropdown === index
                  ? "opacity-100 scale-y-100 visible"
                  : "opacity-0 scale-y-95 invisible"
              }`}
              style={{ minWidth: 180, maxHeight: 220 }}
            >
              {dropdown.options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    const updated = [...selectedValues];
                    updated[index] = option;
                    setSelectedValues(updated);
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition whitespace-nowrap"
                >
                  {option || `Semua ${dropdown.label}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Reset Buttons */}
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition cursor-pointer"
        >
          Filter
        </button>
        <button
          onClick={reset}
          className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50 transition cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterSearchField;