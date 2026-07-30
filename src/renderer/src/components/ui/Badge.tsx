import React from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'sm',
  dot = false,
  children,
  className = ''
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#1D222B] text-[#B6BDC8] border-[#2A2F39]',
    success: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30 font-semibold',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30 font-semibold',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-semibold',
    primary: 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-semibold'
  }

  const dotColors = {
    default: 'bg-[#7A8495]',
    success: 'bg-[#22C55E] shadow-[0_0_8px_#22C55E]',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400 shadow-[0_0_8px_#3B82F6]',
    primary: 'bg-blue-400'
  }

  const sizeStyles = {
    sm: 'text-xs px-3 py-1 font-medium',
    md: 'text-sm px-3.5 py-1.5 font-medium'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}
