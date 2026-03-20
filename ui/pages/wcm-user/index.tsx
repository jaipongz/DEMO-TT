import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import { api } from '../../utils/api'
import GenericList from '../../components/lists/GenericList'
import { ContextMenuItem } from '../../components/core/ContextMenu'
import { wcmUserListConfig } from '../../config/lists/wcmUserListConfig'

export default function CMSUserList() {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const buildContextMenu = (row: any): ContextMenuItem[] => [
    {
      label: 'Open',
      onClick: () => router.push(`/wcm-user/${row.id}`),
    },
    {
      label: 'Edit',
      onClick: () => router.push(`/wcm-user/${row.id}`),
    },
    {
      label: 'Delete',
      className: 'text-[color:var(--danger)]',
      onClick: async () => {
        if (confirm('Are you sure you want to delete this user?')) {
          await api.delete(`/wcm-users/${row.id}`)
          await mutate('/wcm-users')
        }
      },
    },
  ]

  const listConfig = useMemo(() => ({
    ...wcmUserListConfig,
    onRowOpen: (row: any) => {
      void router.push(`/wcm-user/${row.id}`)
    },
  }), [router])

  return <GenericList config={listConfig} contextMenuBuilder={buildContextMenu} />
}
