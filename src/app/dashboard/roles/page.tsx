'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import {
  createRole,
  deleteRole,
  fetchAdminIdentities,
  fetchAdminRoles,
  fetchPermissions,
  fetchRolePermissionIds,
  fetchRoles,
  setAdminRoles,
  setRolePermissions,
  updateRole,
  type PermissionRecord,
  type RoleRecord,
} from '@/lib/data'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'

type Status = { type: 'success' | 'error'; message: string } | null

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  pos: 'Point de vente',
  tables: 'Tables',
  halls: 'Salles',
  reservation_halls: 'Reservations de salles',
  reservations: 'Reservations',
  orders: 'Commandes',
  menus: 'Menus',
  products: 'Produits',
  categories: 'Categories',
  addons: 'Addons',
  settings: 'Parametres',
  help: 'Aide',
  roles: 'Roles & permissions',
  admins: 'Administrateurs',
}

const ACTION_LABELS: Record<string, string> = {
  read: 'Voir',
  create: 'Creer',
  update: 'Modifier',
  delete: 'Supprimer',
  confirm: 'Confirmer',
  cancel: 'Annuler',
  export: 'Exporter',
  pay: 'Encaisser',
  assign: 'Assigner',
}

function getPermissionSummary(permission: PermissionRecord): string {
  const moduleLabel = MODULE_LABELS[permission.module] ?? permission.module
  const actionLabel = ACTION_LABELS[permission.action] ?? permission.action
  return `${actionLabel} - ${moduleLabel}`
}

function getPermissionDescription(permission: PermissionRecord): string {
  if (permission.description?.trim()) return permission.description
  const moduleLabel = MODULE_LABELS[permission.module] ?? permission.module
  const actionLabel = ACTION_LABELS[permission.action] ?? permission.action
  return `Autorise l'action "${actionLabel}" sur le module "${moduleLabel}".`
}

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const canRead = hasPermission('roles.read')
  const canCreate = hasPermission('roles.create')
  const canUpdate = hasPermission('roles.update')
  const canDelete = hasPermission('roles.delete')
  const canAssign = hasPermission('roles.assign')

  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [newRoleCode, setNewRoleCode] = useState('')
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [editRoleLabel, setEditRoleLabel] = useState('')
  const [editRoleDescription, setEditRoleDescription] = useState('')
  const [admins, setAdmins] = useState<Array<{ id: string; email: string }>>([])
  const [adminRoleMap, setAdminRoleMap] = useState<Record<string, string[]>>({})
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionRecord[]>()
    for (const permission of permissions) {
      const list = map.get(permission.module) ?? []
      list.push(permission)
      map.set(permission.module, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [permissions])

  useEffect(() => {
    if (!selectedRole) {
      setEditRoleLabel('')
      setEditRoleDescription('')
      return
    }
    setEditRoleLabel(selectedRole.label)
    setEditRoleDescription(selectedRole.description ?? '')
  }, [selectedRoleId, selectedRole])

  const loadData = async () => {
    if (!canRead) return
    setLoading(true)
    try {
      const [rolesData, permissionsData, adminData, adminRolesData] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchAdminIdentities(),
        fetchAdminRoles(),
      ])
      setRoles(rolesData)
      setPermissions(permissionsData)
      setAdmins(adminData)
      if (!selectedRoleId && rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id)
      }
      const map: Record<string, string[]> = {}
      for (const row of adminRolesData) {
        map[row.admin_id] = [...(map[row.admin_id] ?? []), row.role_id]
      }
      setAdminRoleMap(map)
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Erreur lors du chargement RBAC.'),
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
    if (!selectedRoleId) return
    let ignore = false
    const loadRolePermissions = async () => {
      try {
        const ids = await fetchRolePermissionIds(selectedRoleId)
        if (!ignore) setSelectedPermissionIds(new Set(ids))
      } catch (error) {
        if (!ignore) {
          setStatus({
            type: 'error',
            message: getDashboardActionErrorMessage(
              error,
              'Erreur lors du chargement des permissions du rôle.'
            ),
          })
        }
      }
    }
    loadRolePermissions()
    return () => {
      ignore = true
    }
  }, [selectedRoleId])

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
  }

  const handleCreateRole = async () => {
    if (!canCreate) return
    if (!newRoleCode.trim() || !newRoleLabel.trim()) {
      setStatus({ type: 'error', message: 'Le code et le libellé du rôle sont obligatoires.' })
      return
    }
    try {
      const role = await createRole({
        code: newRoleCode,
        label: newRoleLabel,
        description: newRoleDescription,
      })
      setRoles((prev) => [...prev, role].sort((a, b) => a.label.localeCompare(b.label)))
      setSelectedRoleId(role.id)
      setNewRoleCode('')
      setNewRoleLabel('')
      setNewRoleDescription('')
      setStatus({ type: 'success', message: 'Rôle créé.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Création du rôle impossible.'),
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!canUpdate || !selectedRole) return
    if (!editRoleLabel.trim()) {
      setStatus({ type: 'error', message: 'Le libellé du rôle est obligatoire.' })
      return
    }
    try {
      const updated = await updateRole(selectedRole.id, {
        label: editRoleLabel,
        description: editRoleDescription,
      })
      setRoles((prev) => prev.map((role) => (role.id === updated.id ? updated : role)))
      setEditRoleLabel(updated.label)
      setEditRoleDescription(updated.description ?? '')
      setStatus({ type: 'success', message: 'Rôle mis à jour.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Mise à jour du rôle impossible.'),
      })
    }
  }

  const handleDeleteRole = async () => {
    if (!canDelete || !selectedRole || selectedRole.is_system) return
    try {
      await deleteRole(selectedRole.id)
      setRoles((prev) => prev.filter((role) => role.id !== selectedRole.id))
      setSelectedRoleId('')
      setSelectedPermissionIds(new Set())
      setStatus({ type: 'success', message: 'Rôle supprimé.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Suppression du rôle impossible.'),
      })
    }
  }

  const handleSavePermissions = async () => {
    if (!canAssign || !selectedRoleId) return
    setSavingPermissions(true)
    try {
      await setRolePermissions(selectedRoleId, Array.from(selectedPermissionIds))
      setStatus({ type: 'success', message: 'Permissions du rôle mises à jour.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Enregistrement des permissions impossible.'),
      })
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleAdminRoleToggle = async (adminId: string, roleId: string, checked: boolean) => {
    if (!canAssign) return
    const current = new Set(adminRoleMap[adminId] ?? [])
    if (checked) current.add(roleId)
    else current.delete(roleId)
    const next = Array.from(current)
    try {
      await setAdminRoles(adminId, next)
      setAdminRoleMap((prev) => ({ ...prev, [adminId]: next }))
      setStatus({ type: 'success', message: 'Rôles utilisateur mis à jour.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Mise à jour des rôles utilisateur impossible.'),
      })
    }
  }

  const toggleModule = (module: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev)
      if (next.has(module)) next.delete(module)
      else next.add(module)
      return next
    })
  }

  if (!canRead) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Rôles & Permissions</h1>
        <Card variant="dashboard">
          <CardContent className="py-8 text-center text-gray-500">
            Permission insuffisante pour accéder à ce module.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rôles & Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les rôles, leurs permissions par module et leur attribution aux administrateurs.
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
            <CardTitle>Rôles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition ${selectedRoleId === role.id ? 'border-[#F4A024] bg-[#F4A024]/5' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{role.label}</span>
                    {role.is_system && <Badge variant="info" size="sm">Système</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{role.code}</p>
                  {role.description && (
                    <p className="text-xs text-gray-600 mt-1">{role.description}</p>
                  )}
                </button>
              ))
            )}

            {canCreate && (
              <div className="mt-4 border-t pt-4 space-y-2">
                <Input
                  placeholder="Code (ex: support)"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                />
                <Input
                  placeholder="Libellé"
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                />
                <Input
                  placeholder="Description (optionnel)"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
                <Button className="w-full" onClick={handleCreateRole}>Créer le rôle</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="dashboard" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Permissions du rôle</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleUpdateRole} disabled={!selectedRole || !canUpdate}>
                Mettre a jour
              </Button>
              <Button variant="outline" onClick={handleDeleteRole} disabled={!selectedRole || !canDelete || !!selectedRole?.is_system}>
                Supprimer
              </Button>
              <Button onClick={handleSavePermissions} disabled={!selectedRoleId || !canAssign || savingPermissions}>
                {savingPermissions ? 'Enregistrement...' : 'Enregistrer permissions'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <p className="text-sm text-gray-500">Sélectionnez un rôle pour gérer ses permissions.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <h3 className="text-sm font-semibold text-gray-800">Métadonnées du rôle</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Modifiez le libellé et la description du rôle sélectionné, puis cliquez sur "Mettre a jour".
                  </p>
                  <div className="mt-3 grid gap-3">
                    <Input value={selectedRole.code} disabled className="bg-gray-50" />
                    <Input
                      placeholder="Libellé du rôle"
                      value={editRoleLabel}
                      onChange={(e) => setEditRoleLabel(e.target.value)}
                      disabled={!canUpdate}
                    />
                    <Textarea
                      placeholder="Description du rôle"
                      value={editRoleDescription}
                      onChange={(e) => setEditRoleDescription(e.target.value)}
                      disabled={!canUpdate}
                      className="min-h-[88px]"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-700">{selectedPermissionIds.size}</span> permission(s)
                  sélectionnée(s) sur <span className="font-medium text-gray-700">{permissions.length}</span>.
                </div>
                {groupedPermissions.map(([module, perms]) => (
                  <div key={module} className="rounded-lg border border-gray-200 p-3">
                    <button
                      type="button"
                      className="mb-2 flex w-full items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-2 text-left hover:bg-gray-100"
                      onClick={() => toggleModule(module)}
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          {MODULE_LABELS[module] ?? module}
                        </h3>
                        <p className="text-xs text-gray-500">{module}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">
                          {perms.filter((permission) => selectedPermissionIds.has(permission.id)).length}/{perms.length} selectionnees
                        </span>
                        <span
                          className={`inline-block text-sm text-gray-500 transition-transform duration-300 ${openModules.has(module) ? 'rotate-180' : 'rotate-0'}`}
                        >
                          v
                        </span>
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openModules.has(module) ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="grid gap-2 pt-1 md:grid-cols-2">
                        {perms.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              disabled={!canAssign}
                              className="mt-1"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-gray-800">{getPermissionSummary(permission)}</span>
                                <Badge variant="info" size="sm">{permission.code}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">{getPermissionDescription(permission)}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="dashboard">
        <CardHeader>
          <CardTitle>Attribution des rôles aux utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {admins.map((admin) => (
            <div key={admin.id} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-800 mb-2">{admin.email}</p>
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <label key={`${admin.id}-${role.id}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={(adminRoleMap[admin.id] ?? []).includes(role.id)}
                      disabled={!canAssign}
                      onChange={(e) => handleAdminRoleToggle(admin.id, role.id, e.target.checked)}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

