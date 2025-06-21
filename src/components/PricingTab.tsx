"use client"

import { motion } from "framer-motion"

import { cn } from "../lib/utils"
import { Badge } from "./Badge"

interface TabProps {
  text: string
  selected: boolean
  setSelected: (text: string) => void
  discount?: boolean
}

export function Tab({
  text,
  selected,
  setSelected,
  discount = false,
}: TabProps) {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "relative w-fit px-4 py-2 text-sm font-semibold capitalize",
        "transition-colors",
        selected ? "text-white" : "text-gray-600 hover:text-gray-800",
        discount && "flex items-center justify-center gap-2.5"
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-full bg-green-600 shadow-sm"
        />
      )}
      {discount && (
        <Badge
          variant="secondary"
          className={cn(
            "relative z-10 whitespace-nowrap shadow-none",
            selected ? "bg-green-500 text-white border-green-500" : "bg-gray-100 text-gray-700"
          )}
        >
          Save 35%
        </Badge>
      )}
    </button>
  )
} 