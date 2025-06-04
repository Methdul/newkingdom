import * as React from "react"
import { cn } from "@/lib/utils"

// Define variant styles as objects
const buttonVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
  ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  link: "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500",
}

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3 text-sm",
  lg: "h-11 rounded-md px-8 text-lg",
  icon: "h-10 w-10",
}

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = buttonVariants[variant]
    const sizeClasses = buttonSizes[size]
    
    if (asChild && React.isValidElement(props.children)) {
      // If asChild is true, clone the child element and apply our classes
      return React.cloneElement(props.children as React.ReactElement, {
        className: cn(baseClasses, variantClasses, sizeClasses, className),
        ref,
        ...props,
      })
    }

    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }