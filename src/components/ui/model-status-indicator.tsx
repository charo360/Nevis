'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ModelStatusProps {
  className?: string
}

export function ModelStatusIndicator({ className }: ModelStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-600">Revo 1.0</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-600">Revo 1.5</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-green-600">Revo 2.0</span>
      </div>
    </div>
  )
}

export function ModelRecommendation() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs">✨</span>
        </div>
        <div>
          <h4 className="font-medium text-green-900 mb-1">Hey there! 👋</h4>
          <p className="text-green-700 text-sm mb-2">
            Some of our AI models are taking a quick coffee break ☕ (it happens to the best of us!).
          </p>
          <p className="text-green-700 text-sm font-medium">
            🚀 <strong>Revo 2.0 is wide awake and ready to create amazing content for you!</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
