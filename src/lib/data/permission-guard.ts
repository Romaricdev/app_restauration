import { supabase } from '@/lib/supabase'

const DEFAULT_PERMISSION_ERROR =
  "Vous ne pouvez pas effectuer cette action car vous n'avez pas les permissions requises."

export async function assertPermission(permissionCode: string, message?: string): Promise<void> {
  const { data, error } = await ((supabase as any).rpc('has_permission', {
    p_permission_code: permissionCode,
  }) as any)
  if (error) throw error
  if (!data) throw new Error(message || DEFAULT_PERMISSION_ERROR)
}
