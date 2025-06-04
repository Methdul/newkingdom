import * as React from "react"
import { cn } from "@/lib/utils"

// Define variant styles as a simple object
const badgeStyles = {
  default: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
  secondary: "border-transparent bg-gray-500 text-white hover:bg-gray-600",
  destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
  outline: "text-gray-700 border-gray-300 bg-transparent hover:bg-gray-50",
  success: "border-transparent bg-green-500 text-white hover:bg-green-600",
  warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
}

export type BadgeVariant = keyof typeof badgeStyles

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        badgeStyles[variant],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }