'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminRoles,
  fetchAdminUsers,
  fetchRoles,
  setAdminRoles,
  updateAdminUser,
  type AdminUserRecord,
  type RoleRecord,
} from '@/lib/data'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'

type Status = { type: 'success' | 'error'; message: string } | null

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const canRead = hasPermission('admins.read')
  const canCreate = hasPermission('admins.create')
  const canUpdate = hasPermission('admins.update')
  const canDelete = hasPermission('admins.delete')
  const canAssign = hasPermission('roles.assign')

  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [adminRoleMap, setAdminRoleMap] = useState<Record<string, string[]>>({})
  const [selectedUserId, setSelectedUserId] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRoleCode, setCreateRoleCode] = useState('admin')
  const [createSuperAdmin, setCreateSuperAdmin] = useState(false)

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null
  const [editName, setEditName] = useState('')
  const [editSuperAdmin, setEditSuperAdmin] = useState(false)

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.code,
        label: role.label,
      })),
    [roles]
  )

  const loadData = async () => {
    if (!canRead) return
    setLoading(true)
    try {
      const [usersData, rolesData, adminRolesData] = await Promise.all([
        fetchAdminUsers(),
        fetchRoles(),
        fetchAdminRoles(),
      ])
      setUsers(usersData)
      setRoles(rolesData)
      if (!selectedUserId && usersData.length > 0) {
        setSelectedUserId(usersData[0].id)
      }
      const map: Record<string, string[]> = {}
      for (const row of adminRolesData) {
        map[row.admin_id] = [...(map[row.admin_id] ?? []), row.role_id]
      }
      setAdminRoleMap(map)
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Chargement utilisateurs impossible.'),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead])

  useEffect(() => {
    if (!selectedUser) return
    setEditName(selectedUser.name)
    setEditSuperAdmin(selectedUser.is_super_admin)
  }, [selectedUserId, selectedUser])

  const handleCreateUser = async () => {
    if (!canCreate) return
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      setStatus({ type: 'error', message: 'Nom, email et mot de passe sont obligatoires.' })
      return
    }
    if (createPassword.length < 8) {
      setStatus({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caracteres.' })
      return
    }
    setSaving(true)
    try {
      await createAdminUser({
        name: createName,
        email: createEmail,
        password: createPassword,
        isSuperAdmin: createSuperAdmin,
        roleCode: createRoleCode,
      })
      setCreateName('')
      setCreateEmail('')
      setCreatePassword('')
      setCreateRoleCode('admin')
      setCreateSuperAdmin(false)
      await loadData()
      setStatus({ type: 'success', message: 'Utilisateur admin cree.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Creation utilisateur impossible.'),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!canUpdate || !selectedUser) return
    if (!editName.trim()) {
      setStatus({ type: 'error', message: 'Le nom est obligatoire.' })
      return
    }
    setSaving(true)
    try {
      await updateAdminUser(selectedUser.id, {
        name: editName,
        isSuperAdmin: editSuperAdmin,
      })
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? { ...user, name: editName.trim(), is_super_admin: editSuperAdmin }
            : user
        )
      )
      setStatus({ type: 'success', message: 'Profil utilisateur mis a jour.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Mise a jour utilisateur impossible.'),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!canDelete || !selectedUser) return
    setSaving(true)
    try {
      await deleteAdminUser(selectedUser.id)
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id))
      setSelectedUserId('')
      setStatus({ type: 'success', message: 'Utilisateur supprime.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Suppression utilisateur impossible.'),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUserRoleToggle = async (roleId: string, checked: boolean) => {
    if (!selectedUser || !canAssign) return
    const current = new Set(adminRoleMap[selectedUser.id] ?? [])
    if (checked) current.add(roleId)
    else current.delete(roleId)
    const next = Array.from(current)
    try {
      await setAdminRoles(selectedUser.id, next)
      setAdminRoleMap((prev) => ({ ...prev, [selectedUser.id]: next }))
      setStatus({ type: 'success', message: 'Roles utilisateur mis a jour.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Attribution de roles impossible.'),
      })
    }
  }

  if (!canRead) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <Card variant="dashboard">
          <CardContent className="py-8 text-center text-gray-500">
            Permission insuffisante pour acceder a ce module.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gere les comptes admin de la plateforme et leur attribution de roles.
        </p>
      </div>

      {status && (
        <div className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="dashboard" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Liste utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition ${selectedUserId === user.id ? 'border-[#F4A024] bg-[#F4A024]/5' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 truncate">{user.name}</span>
                    {user.is_super_admin && <Badge variant="info" size="sm">Super Admin</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card variant="dashboard" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gestion utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-800">Creer un utilisateur admin</h3>
              <p className="text-xs text-gray-500 mt-1">
                Creation complete: compte Auth + profil admin + role initial, sans confirmation email.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Nom complet"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  disabled={!canCreate || saving}
                />
                <Input
                  placeholder="email@domaine.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  disabled={!canCreate || saving}
                />
                <Input
                  type="password"
                  placeholder="Mot de passe (min 8 caracteres)"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  disabled={!canCreate || saving}
                />
                <Select
                  value={createRoleCode}
                  onValueChange={setCreateRoleCode}
                  options={roleOptions}
                  disabled={!canCreate || saving}
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={createSuperAdmin}
                    onChange={(e) => setCreateSuperAdmin(e.target.checked)}
                    disabled={!canCreate || saving}
                  />
                  <span>Marquer en super admin</span>
                </label>
              </div>
              <div className="mt-3">
                <Button onClick={handleCreateUser} disabled={!canCreate || saving}>
                  {saving ? 'Traitement...' : 'Creer utilisateur'}
                </Button>
              </div>
            </div>

            {!selectedUser ? (
              <p className="text-sm text-gray-500">Selectionnez un utilisateur pour modifier son profil et ses roles.</p>
            ) : (
              <div className="rounded-lg border border-gray-200 p-3 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Profil utilisateur</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Input value={selectedUser.email} disabled className="bg-gray-50" />
                    <Input
                      placeholder="Nom"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!canUpdate || saving}
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={editSuperAdmin}
                        onChange={(e) => setEditSuperAdmin(e.target.checked)}
                        disabled={!canUpdate || saving}
                      />
                      <span>Super admin</span>
                    </label>
                    <div className="text-xs text-gray-500 self-center">
                      Cree le {new Date(selectedUser.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" onClick={handleSaveProfile} disabled={!canUpdate || saving}>
                      Mettre a jour
                    </Button>
                    <Button variant="outline" onClick={handleDeleteUser} disabled={!canDelete || saving}>
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-800">Roles attribues</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {roles.map((role) => (
                      <label key={`${selectedUser.id}-${role.id}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={(adminRoleMap[selectedUser.id] ?? []).includes(role.id)}
                          disabled={!canAssign}
                          onChange={(e) => handleUserRoleToggle(role.id, e.target.checked)}
                        />
                        <span>{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
