"use client";

import React from "react";

interface EmailFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmailField: React.FC<EmailFieldProps> = ({ value, onChange }) => {
  return (
    <div className="border-2 border-gray-300 rounded-xl flex items-center px-4 py-3 transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-black mr-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 12H8m8 0l-8-6m8 6l-8 6"
        />
      </svg>
      <input
        type="email"
        value={value}
        onChange={onChange}
        placeholder="Email"
        className="w-full outline-none text-lg placeholder-black text-black"
        required
      />
    </div>
  );
};

export default EmailField;
