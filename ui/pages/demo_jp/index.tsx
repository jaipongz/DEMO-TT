import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import GenericList from '../../components/lists/GenericList'
import { demoJpListConfig } from '../../config/lists/demoJpListConfig'
import { demoJpCustomListConfig } from '../../config/lists/custom/demoJpCustomListConfig'
import { resolveListConfig } from '../../config/lists/resolveListConfig'
import { api } from '../../utils/api'
import { ContextMenuItem } from '../../components/core/ContextMenu'

const module_name = 'demo_jp'

const getRecordId = (row: any) => row?.demo_jp_id || row?.obj_content_id

export default function DemoJpListPage() {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const buildContextMenu = (row: any): ContextMenuItem[] => [
    {
      label: 'Open',
      onClick: () => router.push(`/${module_name}/${getRecordId(row)}?mode=view`),
    },
    {
      label: 'Edit',
      onClick: () => router.push(`/${module_name}/${getRecordId(row)}?mode=edit`),
    },
    {
      label: 'Delete',
      className: 'text-[color:var(--danger)]',
      onClick: async () => {
        if (confirm('Are you sure you want to delete this demo record?')) {
          await api.delete(`/${module_name}/${getRecordId(row)}`)
          await mutate(`/${module_name}`)
        }
      },
    },
  ]

  const listConfig = useMemo(() => ({
    ...resolveListConfig(demoJpListConfig, demoJpCustomListConfig),
    onRowOpen: (row: any) => {
      void router.push(`/${module_name}/${getRecordId(row)}?mode=edit`)
    },
  }), [router])

  return <GenericList config={listConfig} contextMenuBuilder={buildContextMenu} />
}
