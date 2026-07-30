import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  maxWidth?: string
}

export function Dialog({ open, onClose, title, description, children, maxWidth = '900px' }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 backdrop-overlay"
            onClick={onClose}
          />

          {/* Dialog Panel */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative bg-[#171B21] border border-[#2A2F39] rounded-[20px] shadow-2xl overflow-hidden z-10 my-auto"
            style={{ maxWidth, width: '100%' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-5 border-b border-[#252932]">
              <h2
                id="dialog-title"
                className="text-[26px] font-bold text-white tracking-tight leading-tight"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-sm text-[#B6BDC8] leading-relaxed">{description}</p>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-7 right-7 p-2 rounded-xl text-[#7A8495] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Body */}
            <div className="p-8 max-h-[78vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
