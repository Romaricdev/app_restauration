import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface CreateAdminUserBody {
  name: string
  email: string
  password: string
  isSuperAdmin?: boolean
  roleCode?: string
}

function parseBody(body: unknown): CreateAdminUserBody | null {
  if (!body || typeof body !== 'object') return null
  const raw = body as Record<string, unknown>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : ''
  const password = typeof raw.password === 'string' ? raw.password : ''
  const roleCode = typeof raw.roleCode === 'string' ? raw.roleCode.trim().toLowerCase() : 'admin'
  const isSuperAdmin = raw.isSuperAdmin === true
  if (!name || !email || !password) return null
  if (password.length < 8) return null
  return { name, email, password, isSuperAdmin, roleCode }
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Configuration serveur Supabase incomplete (URL/ANON/SERVICE_ROLE).' },
      { status: 503 }
    )
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'Session invalide (token manquant).' }, { status: 401 })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  try {
    const { data: authUserData, error: authUserError } = await userClient.auth.getUser()
    if (authUserError || !authUserData.user) {
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })
    }

    const { data: canCreate, error: permissionError } = await ((userClient as any).rpc('has_permission', {
      p_permission_code: 'admins.create',
    }) as any)
    if (permissionError) {
      return NextResponse.json({ error: permissionError.message || 'Verification permission impossible.' }, { status: 403 })
    }
    if (!canCreate) {
      return NextResponse.json({ error: 'Permission admins.create requise.' }, { status: 403 })
    }

    const rawBody = await request.json()
    const body = parseBody(rawBody)
    if (!body) {
      return NextResponse.json({ error: 'Body invalide: name, email, password (min 8) requis.' }, { status: 400 })
    }

    const { data: authCreate, error: authCreateError } = await serviceClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.name },
    })
    if (authCreateError || !authCreate.user) {
      return NextResponse.json(
        { error: authCreateError?.message || 'Creation auth user impossible.' },
        { status: 400 }
      )
    }

    const authUserId = authCreate.user.id

    const { data: insertedAdmin, error: insertAdminError } = await (serviceClient.from('admins') as any)
      .insert({
        name: body.name,
        email: body.email,
        auth_user_id: authUserId,
        is_super_admin: body.isSuperAdmin ?? false,
        permissions: [],
      })
      .select('id')
      .single()

    if (insertAdminError || !insertedAdmin) {
      await serviceClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        { error: insertAdminError?.message || 'Creation admin impossible.' },
        { status: 400 }
      )
    }

    const { data: role, error: roleError } = await (serviceClient.from('roles') as any)
      .select('id')
      .eq('code', body.roleCode || 'admin')
      .maybeSingle()

    if (roleError) {
      return NextResponse.json({ error: roleError.message || 'Lecture role impossible.' }, { status: 400 })
    }

    let roleId = role?.id as string | undefined
    if (!roleId) {
      const { data: fallbackRole } = await (serviceClient.from('roles') as any)
        .select('id')
        .eq('code', 'admin')
        .maybeSingle()
      roleId = fallbackRole?.id as string | undefined
    }

    if (roleId) {
      const { error: assignError } = await (serviceClient.from('admin_roles') as any).insert({
        admin_id: insertedAdmin.id,
        role_id: roleId,
      })
      if (assignError && assignError.code !== '23505') {
        return NextResponse.json({ error: assignError.message || 'Attribution role impossible.' }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, adminId: insertedAdmin.id, authUserId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
