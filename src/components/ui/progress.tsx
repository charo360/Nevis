"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-secondary transition-all duration-normal ease-out",
  {
    variants: {
      variant: {
        default: "",
        gradient: "",
        glow: "shadow-glow",
        glass: "glass backdrop-blur-sm",
      },
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const progressBarVariants = cva(
  "h-full w-full flex-1 transition-all duration-slower ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        gradient: "bg-gradient-to-r from-primary-400 to-primary-600",
        glow: "bg-primary shadow-glow animate-pulse-glow",
        glass: "bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm",
      },
      animated: {
        true: "relative overflow-hidden",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  animated?: boolean
  showValue?: boolean
  label?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    variant, 
    size, 
    value = 0, 
    max = 100, 
    animated = false,
    showValue = false,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div className="space-y-2">
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm">
            {label && <span className="font-medium">{label}</span>}
            {showValue && (
              <span className="text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressVariants({ variant, size, className }))}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ 
                variant, 
                animated: animated ? true : false 
              })
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          >
            {animated && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </div>
        </div>
      </div>
    )
  }
)
Progress.displayName = "Progress"

// Circular Progress Component
export interface CircularProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<ProgressProps, "size"> {
  size?: number
  strokeWidth?: number
  showValue?: boolean
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    className, 
    variant = "default", 
    value = 0, 
    max = 100, 
    size = 120,
    strokeWidth = 8,
    showValue = true,
    label,
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const getStrokeColor = () => {
      switch (variant) {
        case "gradient":
          return "url(#gradient)"
        case "glow":
          return "hsl(var(--primary))"
        case "glass":
          return "rgba(255, 255, 255, 0.5)"
        default:
          return "hsl(var(--primary))"
      }
    }

    return (
      <div 
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className={cn(
            "transform -rotate-90 transition-all duration-slower ease-out",
            variant === "glow" && "drop-shadow-glow",
            animated && "animate-pulse"
          )}
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary-400))" />
              <stop offset="100%" stopColor="hsl(var(--primary-600))" />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--secondary))"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-20"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-slower ease-out"
            style={{
              filter: variant === "glow" ? "drop-shadow(0 0 8px hsl(var(--primary)))" : undefined
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className="text-2xl font-bold">
              {Math.round(percentage)}%
            </span>
          )}
          {label && (
            <span className="text-sm text-muted-foreground mt-1">
              {label}
            </span>
          )}
        </div>
      </div>
    )
  }
)
CircularProgress.displayName = "CircularProgress"

// Multi-step Progress Component
export interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Array<{
    label: string
    description?: string
    completed?: boolean
    current?: boolean
  }>
  variant?: "default" | "gradient" | "glass"
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ className, steps, variant = "default", ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-normal ease-out",
                    step.completed
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : step.current
                      ? "bg-primary/20 text-primary border-2 border-primary animate-pulse-glow"
                      : "bg-secondary text-muted-foreground",
                    variant === "glass" && "glass backdrop-blur-sm"
                  )}
                >
                  {step.completed ? "✓" : index + 1}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{step.label}</div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-all duration-normal ease-out",
                    step.completed
                      ? "bg-primary"
                      : "bg-secondary"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }
)
StepProgress.displayName = "StepProgress"

export { Progress, CircularProgress, StepProgress, progressVariants }
