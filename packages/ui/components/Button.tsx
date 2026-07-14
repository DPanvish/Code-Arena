"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../utils/cn"; 

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const ClayButton = ({ children, variant = "primary", className, ...props }: ButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95, boxShadow: "var(--shadow-clay-button-active)" }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn(
        "relative px-6 py-3 font-semibold rounded-clay-button shadow-clay-button overflow-hidden transition-colors",
        variant === "primary" ? "bg-gradient-to-br from-primary-indigo via-primary-violet to-primary-cyan text-white" : "bg-white text-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};