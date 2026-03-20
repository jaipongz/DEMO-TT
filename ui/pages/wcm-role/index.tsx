import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import { api } from '../../utils/api'
import GenericList from '../../components/lists/GenericList'
import { ContextMenuItem } from '../../components/core/ContextMenu'
import { wcmRoleListConfig } from '../../config/lists/wcmRoleListConfig'

export default function RoleList() {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const buildContextMenu = (row: any): ContextMenuItem[] => [
    {
      label: 'Open',
      onClick: () => router.push(`/wcm-role/${row.id}`),
    },
    {
      label: 'Edit',
      onClick: () => router.push(`/wcm-role/${row.id}`),
    },
    {
      label: 'Delete',
      className: 'text-[color:var(--danger)]',
      onClick: async () => {
        if (confirm('Are you sure you want to delete this role?')) {
          await api.delete(`/wcm-roles/${row.id}`)
          await mutate('/wcm-roles')
        }
      },
    },
  ]

  const listConfig = useMemo(() => ({
    ...wcmRoleListConfig,
    onRowOpen: (row: any) => {
      void router.push(`/wcm-role/${row.id}`)
    },
  }), [router])

  return <GenericList config={listConfig} contextMenuBuilder={buildContextMenu} />
}
