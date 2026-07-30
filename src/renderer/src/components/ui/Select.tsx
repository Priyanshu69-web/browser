import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-semibold text-[#B6BDC8] select-none">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full h-[48px] rounded-xl px-4 text-sm appearance-none
              bg-[#111418] border border-[#2A2F39]
              text-white
              transition-all duration-150
              focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/30
              hover:border-[#3F4654]
              disabled:opacity-40 disabled:cursor-not-allowed
              cursor-pointer pr-10
              ${error ? 'border-red-500/50' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-[#171B21] text-[#7A8495]">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-[#171B21] text-white py-1.5"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A8495]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-400 font-medium mt-0.5">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
