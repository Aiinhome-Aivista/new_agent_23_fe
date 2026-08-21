import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-hover-orange",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-sidebar-bg",
    destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
    outline: "text-foreground",
    success: "border-transparent bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
    info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}

export { Badge }
