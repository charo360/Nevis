"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ParticleBackgroundProps {
  className?: string
  particleCount?: number
  particleColor?: string
  particleSize?: number
  speed?: number
  children?: React.ReactNode
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

export const ParticleBackground = React.forwardRef<HTMLDivElement, ParticleBackgroundProps>(
  ({ 
    className, 
    particleCount = 50, 
    particleColor = "rgba(59, 130, 246, 0.5)", 
    particleSize = 2, 
    speed = 0.5,
    children,
    ...props 
  }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const animationRef = React.useRef<number>()
    const particlesRef = React.useRef<Particle[]>([])

    React.useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }

      const createParticles = () => {
        particlesRef.current = []
        for (let i = 0; i < particleCount; i++) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            size: Math.random() * particleSize + 1,
            opacity: Math.random() * 0.5 + 0.2,
          })
        }
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particlesRef.current.forEach((particle) => {
          // Update position
          particle.x += particle.vx
          particle.y += particle.vy

          // Bounce off edges
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

          // Keep particles in bounds
          particle.x = Math.max(0, Math.min(canvas.width, particle.x))
          particle.y = Math.max(0, Math.min(canvas.height, particle.y))

          // Draw particle
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = particleColor.replace(/[\d\.]+\)$/g, `${particle.opacity})`)
          ctx.fill()
        })

        // Draw connections between nearby particles
        particlesRef.current.forEach((particle, i) => {
          particlesRef.current.slice(i + 1).forEach((otherParticle) => {
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 100) {
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(otherParticle.x, otherParticle.y)
              ctx.strokeStyle = particleColor.replace(/[\d\.]+\)$/g, `${0.1 * (1 - distance / 100)})`)
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          })
        })

        animationRef.current = requestAnimationFrame(animate)
      }

      resizeCanvas()
      createParticles()
      animate()

      const handleResize = () => {
        resizeCanvas()
        createParticles()
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }, [particleCount, particleColor, particleSize, speed])

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
ParticleBackground.displayName = "ParticleBackground"

// Gradient Mesh Background
export interface GradientMeshProps {
  className?: string
  children?: React.ReactNode
  variant?: "default" | "rainbow" | "ocean" | "sunset" | "forest"
}

export const GradientMesh = React.forwardRef<HTMLDivElement, GradientMeshProps>(
  ({ className, children, variant = "default", ...props }, ref) => {
    const getGradientClass = () => {
      switch (variant) {
        case "rainbow":
          return "bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600"
        case "ocean":
          return "bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600"
        case "sunset":
          return "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600"
        case "forest":
          return "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600"
        default:
          return "gradient-mesh"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          getGradientClass(),
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
GradientMesh.displayName = "GradientMesh"

// Animated Grid Background
export interface AnimatedGridProps {
  className?: string
  children?: React.ReactNode
  gridSize?: number
  lineColor?: string
  animate?: boolean
}

export const AnimatedGrid = React.forwardRef<HTMLDivElement, AnimatedGridProps>(
  ({ 
    className, 
    children, 
    gridSize = 50, 
    lineColor = "rgba(59, 130, 246, 0.1)",
    animate = true,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        style={{
          backgroundImage: `
            linear-gradient(${lineColor} 1px, transparent 1px),
            linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          animation: animate ? "grid-move 20s linear infinite" : undefined,
        }}
        {...props}
      >
        <div className="relative z-10">
          {children}
        </div>
        <style jsx>{`
          @keyframes grid-move {
            0% { background-position: 0 0; }
            100% { background-position: ${gridSize}px ${gridSize}px; }
          }
        `}</style>
      </div>
    )
  }
)
AnimatedGrid.displayName = "AnimatedGrid"

// Floating Orbs Background
export const FloatingOrbs = React.forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute rounded-full opacity-20 animate-float",
                i % 3 === 0 && "bg-primary-400",
                i % 3 === 1 && "bg-accent-400", 
                i % 3 === 2 && "bg-purple-400"
              )}
              style={{
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
FloatingOrbs.displayName = "FloatingOrbs"
