import React, { createContext, useContext, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  exiting?: boolean
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, type, message }])

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 pointer-events-none"
        style={{ paddingTop: '36px' }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => {
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          }} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── Toast Item ───────────────────────────────────────────────────────────────

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    info: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    warning: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  }

  const colorStyles: Record<ToastType, string> = {
    success: 'border-emerald-500/25 text-emerald-400',
    error: 'border-red-500/25 text-red-400',
    info: 'border-blue-500/25 text-blue-400',
    warning: 'border-amber-500/25 text-amber-400'
  }

  const accentGradients: Record<ToastType, string> = {
    success: 'from-emerald-500 to-teal-400',
    error: 'from-red-500 to-rose-400',
    info: 'from-blue-500 to-cyan-400',
    warning: 'from-amber-500 to-yellow-400'
  }

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl
        glass-elevated min-w-[340px] max-w-[440px] relative overflow-hidden
        border ${colorStyles[t.type]}
        ${t.exiting ? 'toast-exit' : 'toast-enter'}
        cursor-pointer
      `}
      onClick={onDismiss}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${accentGradients[t.type]}`} />

      <span className="flex-shrink-0 ml-1">{icons[t.type]}</span>
      <p className="text-sm text-[var(--text-primary)] flex-1 font-medium">{t.message}</p>

      {/* Progress bar */}
      {!t.exiting && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
          <div
            className={`h-full bg-gradient-to-r ${accentGradients[t.type]} opacity-40`}
            style={{ animation: 'progressBar 4s linear forwards' }}
          />
        </div>
      )}
    </div>
  )
}
