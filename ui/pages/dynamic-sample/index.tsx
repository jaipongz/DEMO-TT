import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import GenericList from '../../components/lists/GenericList'
import { dynamicSampleListConfig } from '../../config/lists/dynamicSampleListConfig'
import { ContextMenuItem } from '../../components/core/ContextMenu'
import { api } from '../../utils/api'

export default function DynamicSampleListPage() {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const buildContextMenu = (row: any): ContextMenuItem[] => [
    {
      label: 'Open',
      onClick: () => router.push(`/dynamic-sample/${row.obj_content_id}?mode=view`),
    },
    {
      label: 'Edit',
      onClick: () => router.push(`/dynamic-sample/${row.obj_content_id}?mode=edit`),
    },
    {
      label: 'Delete',
      className: 'text-[color:var(--danger)]',
      onClick: async () => {
        if (confirm('Are you sure you want to delete this item?')) {
          await api.delete(`/articles/${row.obj_content_id}`)
          await mutate('/articles')
        }
      },
    },
  ]

  const listConfig = useMemo(() => ({
    ...dynamicSampleListConfig,
    onRowOpen: (row: any) => {
      void router.push(`/dynamic-sample/${row.obj_content_id}?mode=edit`)
    },
  }), [router])

  return <GenericList config={listConfig} contextMenuBuilder={buildContextMenu} />
}
