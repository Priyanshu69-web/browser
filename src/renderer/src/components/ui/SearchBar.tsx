import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search profiles...',
  className = ''
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(newValue)
    }, 250)
  }

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8495] pointer-events-none" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full h-[48px] rounded-xl pl-11 pr-10 text-sm
          bg-[#111418] border border-[#2A2F39]
          text-white placeholder:text-[#7A8495]
          transition-all duration-150
          focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/30
          hover:border-[#3F4654]
        "
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A8495] hover:text-white transition-colors cursor-pointer p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
