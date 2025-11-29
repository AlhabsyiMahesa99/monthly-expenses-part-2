"use client";

import React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null; // kalau cuma 1 halaman, gak usah tampil

  return (
    <div className="flex justify-center items-center gap-1 mt-5">
      {/* Tombol Previous */}
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Previous
      </button>

      {/* Tombol angka halaman */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={`border border-gray-300 rounded-md px-3 py-1 text-sm cursor-pointer ${
            n === currentPage
              ? "bg-gray-300 font-semibold"
              : "hover:bg-gray-100"
          }`}
        >
          {n}
        </button>
      ))}

      {/* Tombol Next */}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer"
      >
        Next
        <ArrowRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
};

export default Pagination;