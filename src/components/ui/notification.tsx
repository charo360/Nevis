"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const notificationVariants = cva(
  "relative flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-normal ease-out animate-slide-up",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-card-foreground",
        success: "bg-accent-50 border-accent-200 text-accent-900 dark:bg-accent-900/20 dark:border-accent-800 dark:text-accent-100",
        error: "bg-destructive/10 border-destructive/20 text-destructive-foreground",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100",
        info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
        glass: "glass border-white/20 text-foreground",
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string
  description?: string
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
  action?: React.ReactNode
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ 
    className, 
    variant, 
    size, 
    title, 
    description, 
    icon, 
    closable = true, 
    onClose,
    action,
    children,
    ...props 
  }, ref) => {
    const getDefaultIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle className="h-5 w-5 text-accent-600" />
        case "error":
          return <AlertCircle className="h-5 w-5 text-destructive" />
        case "warning":
          return <AlertTriangle className="h-5 w-5 text-yellow-600" />
        case "info":
          return <Info className="h-5 w-5 text-blue-600" />
        default:
          return null
      }
    }

    const displayIcon = icon !== undefined ? icon : getDefaultIcon()

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant, size, className }))}
        {...props}
      >
        {displayIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {displayIcon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-semibold mb-1">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
          {children}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>

        {closable && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Notification.displayName = "Notification"

// Toast notification system
export interface ToastProps extends NotificationProps {
  id?: string
  duration?: number
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
}

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastProps["position"]
  maxToasts?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = "top-right",
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      position: toast.position ?? position,
    }

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts)
      return updated
    })

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [position, maxToasts])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  const getPositionClasses = (pos: ToastProps["position"]) => {
    switch (pos) {
      case "top-left":
        return "top-4 left-4"
      case "top-center":
        return "top-4 left-1/2 -translate-x-1/2"
      case "top-right":
        return "top-4 right-4"
      case "bottom-left":
        return "bottom-4 left-4"
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2"
      case "bottom-right":
        return "bottom-4 right-4"
      default:
        return "top-4 right-4"
    }
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <div className="fixed z-50 pointer-events-none">
        {Object.entries(
          toasts.reduce((acc, toast) => {
            const pos = toast.position || position
            if (!acc[pos]) acc[pos] = []
            acc[pos].push(toast)
            return acc
          }, {} as Record<string, ToastProps[]>)
        ).map(([pos, positionToasts]) => (
          <div
            key={pos}
            className={cn(
              "fixed flex flex-col gap-2 w-full max-w-sm pointer-events-auto",
              getPositionClasses(pos as ToastProps["position"])
            )}
          >
            {positionToasts.map((toast) => (
              <Notification
                key={toast.id}
                {...toast}
                onClose={() => removeToast(toast.id!)}
              />
            ))}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Convenience hooks for different toast types
export const useSuccessToast = () => {
  const { addToast } = useToast()
  return React.useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({ variant: "success", description: message, ...options })
  }, [addToast])
}

export const useErrorToast = () => {
  const { addToast } = useToast()
  return React.useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({ variant: "error", description: message, ...options })
  }, [addToast])
}

export const useInfoToast = () => {
  const { addToast } = useToast()
  return React.useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({ variant: "info", description: message, ...options })
  }, [addToast])
}

export const useWarningToast = () => {
  const { addToast } = useToast()
  return React.useCallback((message: string, options?: Partial<ToastProps>) => {
    return addToast({ variant: "warning", description: message, ...options })
  }, [addToast])
}

export { Notification, notificationVariants }
