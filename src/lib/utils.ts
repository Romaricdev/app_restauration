import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 * Useful for conditional classes and avoiding conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price to French locale
 */
export function formatPrice(price: number, currency: string = 'XAF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format date to French locale
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(d)
}

/**
 * Format time to French locale
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Generate a random ID (crypto-safe when available).
 * Uses crypto.randomUUID() in modern envs, fallback for older runtimes.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    buf[6] = (buf[6]! & 0x0f) | 0x40
    buf[8] = (buf[8]! & 0x3f) | 0x80
    return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Delay execution (for mock loading states)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Slugify string for IDs (e.g. category id from name)
 */
export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item'
}

/** YYYY-MM-DD for local date */
export function todayIso(): string {
  const d = new Date()
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

/**
 * Whether a table reservation is "active" now: we consider it active from
 * (start - windowMinutesBefore) onwards. Used to allow configuring a table
 * 10 minutes before the reservation time.
 */
export function isReservationActiveNow(
  r: { date: string; time: string },
  windowMinutesBefore = 10
): boolean {
  const now = new Date()
  const todayStr = todayIso()
  if (r.date !== todayStr) return false
  const timeStr = String(r.time).slice(0, 5)
  const [h, min] = timeStr.split(':').map(Number)
  const [y, mo, d] = todayStr.split('-').map(Number)
  const start = new Date(y, mo - 1, d, h, min, 0)
  const windowStart = new Date(
    start.getTime() - windowMinutesBefore * 60 * 1000
  )
  return now >= windowStart
}
