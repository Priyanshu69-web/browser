import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-semibold text-[#B6BDC8] select-none">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8495] group-focus-within:text-[#22C55E] transition-colors">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full h-[48px] rounded-xl px-4 text-sm
              bg-[#111418] border border-[#2A2F39]
              text-white placeholder:text-[#7A8495]
              transition-all duration-150
              focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/30
              hover:border-[#3F4654]
              disabled:opacity-40 disabled:cursor-not-allowed
              ${icon ? 'pl-11' : ''}
              ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 font-medium mt-0.5">{error}</p>}
        {hint && !error && <p className="text-xs text-[#7A8495] mt-0.5">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
