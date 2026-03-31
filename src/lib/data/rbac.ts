import { supabase } from '@/lib/supabase'
import { trackedFetch } from '@/lib/network/tracked-fetch'
import { assertPermission } from './permission-guard'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    const maybeDetails = (error as { details?: unknown }).details
    const maybeHint = (error as { hint?: unknown }).hint
    const parts = [maybeMessage, maybeDetails, maybeHint].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )
    if (parts.length > 0) return parts.join(' | ')
  }
  return fallback
}

export interface RoleRecord {
  id: string
  code: string
  label: string
  description: string | null
  is_system: boolean
}

export interface PermissionRecord {
  id: string
  code: string
  module: string
  action: string
  description: string | null
}

export interface AdminRoleRecord {
  admin_id: string
  role_id: string
}

interface AdminIdentity {
  id: string
  email: string
}

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  auth_user_id: string | null
  is_super_admin: boolean
  created_at: string
  last_login_at: string | null
}

export async function fetchRoles(): Promise<RoleRecord[]> {
  const { data, error } = await (supabase.from('roles') as any)
    .select('*')
    .order('is_system', { ascending: false })
    .order('label', { ascending: true })
  if (error) throw error
  return (data ?? []) as RoleRecord[]
}

export async function fetchPermissions(): Promise<PermissionRecord[]> {
  const { data, error } = await (supabase.from('permissions') as any)
    .select('*')
    .order('module', { ascending: true })
    .order('action', { ascending: true })
  if (error) throw error
  return (data ?? []) as PermissionRecord[]
}

export async function fetchRolePermissionIds(roleId: string): Promise<string[]> {
  const { data, error } = await (supabase.from('role_permissions') as any)
    .select('permission_id')
    .eq('role_id', roleId)
  if (error) throw error
  return ((data ?? []) as Array<{ permission_id: string }>).map((row) => row.permission_id)
}

export async function createRole(input: {
  code: string
  label: string
  description?: string
}): Promise<RoleRecord> {
  await assertPermission('roles.create')
  const payload = {
    code: input.code.trim().toLowerCase(),
    label: input.label.trim(),
    description: input.description?.trim() || null,
    is_system: false,
  }
  const { data, error } = await (supabase.from('roles') as any)
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data as RoleRecord
}

export async function updateRole(
  roleId: string,
  input: Partial<{ code: string; label: string; description: string }>
): Promise<RoleRecord> {
  await assertPermission('roles.update')
  const payload: Record<string, unknown> = {}
  if (input.code != null) payload.code = input.code.trim().toLowerCase()
  if (input.label != null) payload.label = input.label.trim()
  if (input.description !== undefined) payload.description = input.description?.trim() || null
  const { data, error } = await (supabase.from('roles') as any)
    .update(payload)
    .eq('id', roleId)
    .select('*')
    .single()
  if (error) throw error
  return data as RoleRecord
}

export async function deleteRole(roleId: string): Promise<void> {
  await assertPermission('roles.delete')
  const { error } = await (supabase.from('roles') as any).delete().eq('id', roleId)
  if (error) throw error
}

export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  await assertPermission('roles.assign')
  const { error: deleteError } = await (supabase.from('role_permissions') as any)
    .delete()
    .eq('role_id', roleId)
  if (deleteError) throw deleteError

  if (permissionIds.length === 0) return

  const rows = permissionIds.map((permissionId) => ({
    role_id: roleId,
    permission_id: permissionId,
  }))
  const { error: insertError } = await (supabase.from('role_permissions') as any).insert(rows)
  if (insertError) throw insertError
}

export async function fetchAdminIdentities(): Promise<AdminIdentity[]> {
  const { data, error } = await (supabase.from('admins') as any)
    .select('id,email')
    .order('email', { ascending: true })
  if (error) throw error
  return (data ?? []) as AdminIdentity[]
}

export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  const { data, error } = await (supabase.from('admins') as any)
    .select('id,name,email,auth_user_id,is_super_admin,created_at,last_login_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminUserRecord[]
}

export async function createAdminUser(input: {
  name: string
  email: string
  password: string
  isSuperAdmin?: boolean
  roleCode?: string
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) {
    throw new Error('Session invalide. Veuillez vous reconnecter.')
  }

  const response = await trackedFetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      isSuperAdmin: input.isSuperAdmin ?? false,
      roleCode: input.roleCode?.trim() || 'admin',
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string; success?: boolean }
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Creation utilisateur impossible (${response.status}).`)
  }
}

export async function updateAdminUser(
  adminId: string,
  input: Partial<{ name: string; isSuperAdmin: boolean }>
): Promise<void> {
  await assertPermission('admins.update')
  const payload: Record<string, unknown> = {}
  if (input.name != null) payload.name = input.name.trim()
  if (input.isSuperAdmin != null) payload.is_super_admin = input.isSuperAdmin
  if (Object.keys(payload).length === 0) return

  const { error } = await (supabase.from('admins') as any)
    .update(payload)
    .eq('id', adminId)
  if (error) throw error
}

export async function deleteAdminUser(adminId: string): Promise<void> {
  await assertPermission('admins.delete')
  const { error } = await (supabase.from('admins') as any).delete().eq('id', adminId)
  if (error) throw error
}

export async function fetchAdminRoles(): Promise<AdminRoleRecord[]> {
  const { data, error } = await (supabase.from('admin_roles') as any).select('admin_id,role_id')
  if (error) throw error
  return (data ?? []) as AdminRoleRecord[]
}

export async function setAdminRoles(adminId: string, roleIds: string[]): Promise<void> {
  await assertPermission('roles.assign')
  const { error: deleteError } = await (supabase.from('admin_roles') as any)
    .delete()
    .eq('admin_id', adminId)
  if (deleteError) throw deleteError

  if (roleIds.length === 0) return

  const rows = roleIds.map((roleId) => ({
    admin_id: adminId,
    role_id: roleId,
  }))
  const { error: insertError } = await (supabase.from('admin_roles') as any).insert(rows)
  if (insertError) throw insertError
}

