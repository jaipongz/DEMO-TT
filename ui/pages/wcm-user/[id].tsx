import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { api } from '../../utils/api'
import { getTimezoneSelectOptions } from '../../utils/timezone'

const fetcher = (url: string) => api.get(url).then(r => r.data)

type Role = {
  id: number
  name: string
  description?: string
}

type Permission = {
  id: number
  module: string
  module_name?: string
  moduleName?: string
  action: string
}

const ACTION_ORDER = ['view', 'modify', 'delete', 'publish', 'export']

const ACTION_ALIASES: Record<string, string[]> = {
  view: ['view', 'read'],
  modify: ['modify', 'update', 'edit', 'create'],
  delete: ['delete', 'remove'],
  publish: ['publish', 'published'],
  export: ['export'],
}

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  modify: 'Modify',
  delete: 'Delete',
  publish: 'Publish',
  export: 'Export',
}

const normalizeAction = (action: string) => {
  const raw = String(action || '').trim().toLowerCase()
  if (!raw) return ''

  for (const [target, aliases] of Object.entries(ACTION_ALIASES)) {
    if (aliases.includes(raw)) return target
  }

  return raw
}

export default function CmsUserDetail() {
  const router = useRouter()
  const rawId = router.query.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const isNew = id === 'new'
  const detailId = !isNew && typeof id === 'string' && id.trim() !== '' ? id : null

  const { data: user, isLoading, error } = useSWR(detailId ? `/wcm-users/${detailId}` : null, fetcher)
  const { data: rolesData } = useSWR('/wcm-roles', fetcher)
  const { data: permissionsData } = useSWR('/wcm-permissions', fetcher)

  const roles: Role[] = Array.isArray(rolesData) ? rolesData : []
  const permissions: Permission[] = Array.isArray(permissionsData) ? permissionsData : []
  const timezoneOptions = useMemo(() => getTimezoneSelectOptions(), [])

  const [formData, setFormData] = useState({
    email: '',
    firstname: '',
    lastname: '',
    timezone: 'Asia/Bangkok',
    password: '',
    roleIds: [] as number[],
    permissionIds: [] as number[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        timezone: user.timezone || 'Asia/Bangkok',
        password: '', // Don't show password on edit
        roleIds: Array.isArray(user.roles)
          ? user.roles.map((item: any) => Number(item.id)).filter((value: number) => Number.isInteger(value) && value > 0)
          : [],
        permissionIds: Array.isArray(user.permissions)
          ? user.permissions.map((item: any) => Number(item.id)).filter((value: number) => Number.isInteger(value) && value > 0)
          : [],
      })
    } else if (isNew) {
      setFormData({ email: '', firstname: '', lastname: '', timezone: 'Asia/Bangkok', password: '', roleIds: [], permissionIds: [] })
    }
  }, [user, isNew])

  const actionKeys = useMemo(() => {
    const discovered = new Set<string>()
    permissions.forEach((permission) => {
      const normalized = normalizeAction(permission.action)
      if (normalized) discovered.add(normalized)
    })

    const ordered = ACTION_ORDER.filter((key) => discovered.has(key))
    const extras = Array.from(discovered).filter((key) => !ACTION_ORDER.includes(key)).sort((left, right) => left.localeCompare(right))
    return [...ordered, ...extras]
  }, [permissions])

  const groupedPermissions = useMemo(() => {
    const moduleMap = new Map<string, Map<string, Permission>>()
    const moduleLabelMap = new Map<string, string>()

    permissions.forEach((permission) => {
      const moduleKey = String(permission.module || '').trim() || 'general'
      const moduleLabel = String(permission.module_name || permission.moduleName || moduleKey).trim() || moduleKey
      const actionKey = normalizeAction(permission.action)
      if (!actionKey) return

      if (!moduleMap.has(moduleKey)) {
        moduleMap.set(moduleKey, new Map())
        moduleLabelMap.set(moduleKey, moduleLabel)
      }

      moduleMap.get(moduleKey)!.set(actionKey, permission)
    })

    return Array.from(moduleMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([moduleKey, actionMap]) => ({ moduleKey, moduleName: moduleLabelMap.get(moduleKey) || moduleKey, actionMap }))
  }, [permissions])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleRole = (roleId: number, checked: boolean) => {
    setFormData((prev) => {
      const next = new Set(prev.roleIds)
      if (checked) next.add(roleId)
      else next.delete(roleId)
      return { ...prev, roleIds: Array.from(next) }
    })
  }

  const togglePermission = (permissionId: number, checked: boolean) => {
    setFormData((prev) => {
      const next = new Set(prev.permissionIds)
      if (checked) next.add(permissionId)
      else next.delete(permissionId)
      return { ...prev, permissionIds: Array.from(next) }
    })
  }

  const handleResetPassword = async () => {
    if (!detailId) return
    const nextPassword = prompt('Enter new password (minimum 6 characters)')
    if (!nextPassword) return

    const password = nextPassword.trim()
    if (password.length < 6) {
      setMessage('Error: Password must be at least 6 characters')
      return
    }

    try {
      setSubmitting(true)
      setMessage('')
      await api.post(`/wcm-users/${detailId}/reset-password`, { password })
      setMessage('Password reset successfully!')
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || 'Failed to reset password'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const fullName = `${formData.firstname} ${formData.lastname}`.trim()
      const submitData = {
        email: formData.email,
        firstname: formData.firstname,
        lastname: formData.lastname,
        timezone: formData.timezone,
        name: fullName || formData.email,
        roleIds: formData.roleIds,
        permissionIds: formData.permissionIds,
        ...(formData.password ? { password: formData.password } : {}),
      }
      
      if (isNew) {
        await api.post('/wcm-users', submitData)
        setMessage('User created successfully!')
        setTimeout(() => router.push('/wcm-user'), 1500)
      } else {
        if (!detailId) {
          throw new Error('Invalid user id')
        }
        await api.put(`/wcm-users/${detailId}`, submitData)
        setMessage('User updated successfully!')
        setTimeout(() => router.push('/wcm-user'), 1500)
      }
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || 'Failed to save'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isNew && isLoading) return <div className="p-6">Loading...</div>
  if (!isNew && error) return <div className="p-6 text-red-600">Error loading user</div>

  const displayLabel = `${formData.firstname} ${formData.lastname}`.trim() || String(id || 'Detail')

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <nav className="text-sm text-[color:var(--text-muted)]" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/wcm-user" className="hover:text-[color:var(--accent)]">CMS User</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[color:var(--text)] font-medium">{isNew ? 'Create' : displayLabel}</li>
          </ol>
        </nav>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="card rounded-xl border border-[color:var(--border)] p-4 sm:p-5 space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </div>
            {!isNew && (
              <button
                type="button"
                onClick={() => void handleResetPassword()}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Reset password
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Firstname <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lastname <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone <span className="text-red-500">*</span></label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full max-w-[520px] px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {isNew && (
            <div>
              <label className="block text-sm font-medium mb-2">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full max-w-[520px] px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </div>
          )}
        </section>

        <section className="card rounded-xl border border-[color:var(--border)] p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-semibold">Assigned role</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-left text-sm text-[color:var(--text-muted)]">
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => {
                  const checked = formData.roleIds.includes(Number(role.id))
                  return (
                    <tr key={role.id} className="border-b border-[color:var(--border)]">
                      <td className="py-4 pr-4">
                        <label className="inline-flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => toggleRole(Number(role.id), event.target.checked)}
                            className="w-4 h-4 rounded accent-[color:var(--accent)]"
                          />
                          <span>{role.name}</span>
                        </label>
                      </td>
                      <td className="py-4">{role.description || '-'}</td>
                    </tr>
                  )
                })}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-6 text-sm text-[color:var(--text-muted)]">No roles found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card rounded-xl border border-[color:var(--border)] p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-semibold">Assigned permission (Individual)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-left text-sm text-[color:var(--text-muted)]">
                  <th className="py-2 pr-4 font-medium">Module</th>
                  <th className="py-2 font-medium">Permission</th>
                </tr>
              </thead>
              <tbody>
                {groupedPermissions.map(({ moduleKey, moduleName, actionMap }) => (
                  <tr key={moduleKey} className="border-b border-[color:var(--border)] align-top">
                    <td className="py-4 pr-4 font-medium">{moduleName}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {actionKeys.map((actionKey) => {
                          const matched = actionMap.get(actionKey)
                          const label = ACTION_LABELS[actionKey] || actionKey
                          const disabled = !matched
                          const checked = matched ? formData.permissionIds.includes(Number(matched.id)) : false

                          return (
                            <label key={`${moduleKey}-${actionKey}`} className={`inline-flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-[color:var(--accent)]"
                                checked={checked}
                                disabled={disabled}
                                onChange={(event) => {
                                  if (!matched) return
                                  togglePermission(Number(matched.id), event.target.checked)
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {groupedPermissions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-6 text-sm text-[color:var(--text-muted)]">No permissions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="sticky bottom-0 z-30 px-4 sm:px-6 border-t border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur" style={{ height: 'var(--nav-height)' }}>
          <div className="flex h-full w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
