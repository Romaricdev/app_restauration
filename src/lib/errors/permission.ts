export function getDashboardActionErrorMessage(error: unknown, fallback: string): string {
  const message = extractErrorText(error).toLowerCase()

  const looksLikePermissionIssue =
    message.includes('permission') ||
    message.includes('not allowed') ||
    message.includes('access denied') ||
    message.includes('forbidden') ||
    message.includes('insufficient') ||
    message.includes('row-level security') ||
    message.includes('rls') ||
    message.includes('42501')

  if (looksLikePermissionIssue) {
    return "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises."
  }

  return extractErrorText(error) || fallback
}

function extractErrorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null) {
    const e = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    const parts = [e.message, e.details, e.hint, e.code]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    if (parts.length > 0) return parts.join(' | ')
  }
  return ''
}
