import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

// A simple toast implementation without a complex context provider for now.
// For a full app, using a library like sonner or react-hot-toast is recommended.
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "destructive" | "warning"
  title?: string
  description?: React.ReactNode
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, onClose, ...props }, ref) => {
    
    const variants = {
      default: "border-border bg-background text-foreground",
      success: "border-green-200 bg-green-50 text-green-900",
      destructive: "border-red-200 bg-red-50 text-red-900",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }
