import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2.5 font-semibold rounded-xl
    transition-all duration-150 cursor-pointer select-none
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/40
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
  `

  const variantStyles = {
    primary: `
      bg-[#22C55E] hover:bg-[#2DD768] text-black shadow-sm font-bold
    `,
    secondary: `
      bg-[#171B21] border border-[#2A2F39]
      text-white hover:bg-white/5 hover:border-[#3F4654]
    `,
    danger: `
      bg-red-500/15 border border-red-500/30
      text-red-400 hover:bg-red-500/25
    `,
    ghost: `
      bg-transparent text-[#B6BDC8]
      hover:bg-white/5 hover:text-white
    `,
    success: `
      bg-[#22C55E]/15 border border-[#22C55E]/30
      text-[#22C55E] hover:bg-[#22C55E] hover:text-black
    `
  }

  const sizeStyles = {
    sm: 'text-xs px-3.5 h-[40px]',
    md: 'text-sm px-5 h-[48px]',
    lg: 'text-base px-6 h-[56px]'
  }

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
