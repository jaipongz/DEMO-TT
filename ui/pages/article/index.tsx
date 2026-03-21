import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import GenericList from '../../components/lists/GenericList'
import { articleListConfig } from '../../config/lists/articleListConfig'
import { articleCustomListConfig } from '../../config/lists/custom/articleCustomListConfig'
import { resolveListConfig } from '../../config/lists/resolveListConfig'
import { api } from '../../utils/api'
import { ContextMenuItem } from '../../components/core/ContextMenu'

const module_name = 'article'
const getRecordId = (row: any) =>
  row?.articleId ||
  row?.article_id ||
  row?.objContentId ||
  row?.obj_content_id

export default function ArticleListPage() {
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
        if (confirm('Are you sure you want to delete this record?')) {
          await api.delete(`/${module_name}/${getRecordId(row)}`)
          await mutate(`/${module_name}`)
        }
      },
    },
  ]

  const listConfig = useMemo(() => ({
    ...resolveListConfig(articleListConfig, articleCustomListConfig),
    onRowOpen: (row: any) => {
      void router.push(`/${module_name}/${getRecordId(row)}?mode=edit`)
    },
  }), [router])

  return <GenericList config={listConfig} contextMenuBuilder={buildContextMenu} />
}
