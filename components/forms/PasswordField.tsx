"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

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
          d="M12 11c.667 0 2-.333 2-2V7a2 2 0 00-4 0v2c0 1.667 1.333 2 2 2zM5 11h14v10H5V11z"
        />
      </svg>

      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder="Password"
        className="w-full outline-none text-lg placeholder-black text-black"
        required
      />

      <AnimatePresence>
        {value && (
          <motion.button
            key="toggle-icon"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="focus:outline-none ml-2 cursor-pointer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {showPassword ? (
              // Show
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              // Hide
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.563-4.155m3.347-2.313A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.249 2.592M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3 0a3 3 0 01-3-3m0 0l-6.5 6.5"
                />
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordField;
