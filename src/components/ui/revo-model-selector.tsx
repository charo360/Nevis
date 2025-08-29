"use client"

import * as React from "react"
import { Check, ChevronDown, Sparkles, Zap, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export type RevoModel = 'revo-1.0' | 'revo-1.5' | 'revo-2.0'

interface RevoModelOption {
  id: RevoModel
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  features: string[]
  status: 'stable' | 'enhanced' | 'development'
}

const REVO_MODELS: RevoModelOption[] = [
  {
    id: 'revo-1.0',
    name: 'Revo 1.0',
    description: 'Standard Model - Stable Foundation',
    icon: Zap,
    badge: 'Stable',
    badgeVariant: 'secondary',
    features: ['Reliable AI Engine', '1:1 Images', 'Core Features', 'Proven Performance'],
    status: 'stable'
  },
  {
    id: 'revo-1.5',
    name: 'Revo 1.5',
    description: 'Enhanced Model - Advanced Features',
    icon: Sparkles,
    badge: 'Enhanced',
    badgeVariant: 'default',
    features: ['Advanced AI Engine', 'Superior Quality', 'Enhanced Design', 'Smart Optimizations'],
    status: 'enhanced'
  },
  {
    id: 'revo-2.0',
    name: 'Revo 2.0',
    description: 'Next-Gen Model - Advanced AI Engine',
    icon: Rocket,
    badge: 'Next-Gen',
    badgeVariant: 'default',
    features: ['Native Image Generation', 'Character Consistency', 'Intelligent Editing', 'Multimodal Reasoning'],
    status: 'enhanced'
  }
]

interface RevoModelSelectorProps {
  selectedModel: RevoModel
  onModelChange: (model: RevoModel) => void
  disabled?: boolean
  className?: string
}

export function RevoModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
  className
}: RevoModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const currentModel = REVO_MODELS.find(model => model.id === selectedModel) || REVO_MODELS[0]
  const CurrentIcon = currentModel.icon

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "min-w-[180px] justify-between",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4" />
            <span>{currentModel.name}</span>
            {currentModel.badge && (
              <Badge variant={currentModel.badgeVariant} className="text-xs">
                {currentModel.badge}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Rocket className="w-4 h-4" />
          Select Revo Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {REVO_MODELS.map((model) => {
          const IconComponent = model.icon
          const isSelected = selectedModel === model.id
          const isAvailable = model.status !== 'development'

          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => {
                if (isAvailable) {
                  onModelChange(model.id)
                  setIsOpen(false)
                }
              }}
              disabled={!isAvailable}
              className={cn(
                "flex flex-col items-start gap-2 p-4 cursor-pointer",
                !isAvailable && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{model.name}</span>
                  {model.badge && (
                    <Badge variant={model.badgeVariant} className="text-xs">
                      {model.badge}
                    </Badge>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 text-green-600" />}
              </div>

              <p className="text-sm text-muted-foreground">
                {model.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {model.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          Each Revo model offers different capabilities and features
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { REVO_MODELS, type RevoModelOption }
