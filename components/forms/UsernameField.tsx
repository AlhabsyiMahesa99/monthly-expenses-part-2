"use client";

import React from "react";

interface UsernameFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UsernameField: React.FC<UsernameFieldProps> = ({ value, onChange }) => {
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
          d="M5.121 17.804A9 9 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Username"
        className="w-full outline-none text-lg placeholder-black text-black"
        required
      />
    </div>
  );
};

export default UsernameField;
