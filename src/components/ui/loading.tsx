import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "animate-spin rounded-full border-2 border-current border-t-transparent",
        dots: "flex space-x-1",
        pulse: "animate-pulse rounded-full bg-current",
        bars: "flex space-x-1",
        wave: "flex space-x-1",
        glow: "animate-pulse-glow rounded-full bg-gradient-to-r from-primary-400 to-accent-400",
      },
      size: {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "default",
    },
  }
)

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, text, ...props }, ref) => {
    const renderLoader = () => {
      switch (variant) {
        case "dots":
          return (
            <div className={cn(loadingVariants({ variant, className }))}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full bg-current animate-bounce",
                    size === "sm" && "w-1 h-1",
                    size === "default" && "w-2 h-2",
                    size === "lg" && "w-3 h-3",
                    size === "xl" && "w-4 h-4"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )
        
        case "bars":
          return (
            <div className={cn(loadingVariants({ variant, className }))}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-current animate-pulse",
                    size === "sm" && "w-0.5 h-3",
                    size === "default" && "w-1 h-4",
                    size === "lg" && "w-1.5 h-6",
                    size === "xl" && "w-2 h-8"
                  )}
                  style={{
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )
        
        case "wave":
          return (
            <div className={cn(loadingVariants({ variant, className }))}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full bg-current animate-bounce",
                    size === "sm" && "w-1 h-1",
                    size === "default" && "w-1.5 h-1.5",
                    size === "lg" && "w-2 h-2",
                    size === "xl" && "w-3 h-3"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )
        
        case "pulse":
          return (
            <div className={cn(loadingVariants({ variant, size, className }))} />
          )
        
        case "glow":
          return (
            <div className={cn(loadingVariants({ variant, size, className }))} />
          )
        
        default:
          return (
            <div className={cn(loadingVariants({ variant, size, className }))} />
          )
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-2", className)}
        {...props}
      >
        {renderLoader()}
        {text && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    )
  }
)
Loading.displayName = "Loading"

// Skeleton component for loading states
const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "",
        text: "h-4",
        avatar: "rounded-full",
        button: "h-10",
        card: "h-32",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

// Loading overlay component
export interface LoadingOverlayProps extends LoadingProps {
  isLoading: boolean
  children: React.ReactNode
  overlay?: boolean
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ isLoading, children, overlay = true, className, ...loadingProps }, ref) => {
    if (!isLoading) {
      return <>{children}</>
    }

    return (
      <div ref={ref} className="relative">
        {children}
        {overlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <Loading {...loadingProps} className={className} />
          </div>
        )}
        {!overlay && (
          <div className="flex items-center justify-center p-8">
            <Loading {...loadingProps} className={className} />
          </div>
        )}
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

export { Loading, Skeleton, LoadingOverlay, loadingVariants, skeletonVariants }
