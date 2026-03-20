import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import GenericList from '../../components/lists/GenericList'
import { articlesListConfig } from '../../config/lists/articlesListConfig'
import { articlesCustomListConfig } from '../../config/lists/custom/articlesCustomListConfig'
import { resolveListConfig } from '../../config/lists/resolveListConfig'
import { api } from '../../utils/api'
import { ContextMenuItem } from '../../components/core/ContextMenu'

export default function ArticlesList() {
	const router = useRouter()
	const { mutate } = useSWRConfig()

	const buildContextMenu = (row: any): ContextMenuItem[] => [
		{
			label: 'Open',
			onClick: () => router.push(`/articles/${row.obj_content_id}?mode=view`),
		},
		{
			label: 'Edit',
			onClick: () => router.push(`/articles/${row.obj_content_id}?mode=edit`),
		},
		{
			label: 'Delete',
			className: 'text-[color:var(--danger)]',
			onClick: async () => {
				if (confirm('Are you sure you want to delete this article?')) {
					await api.delete(`/articles/${row.obj_content_id}`)
					await mutate('/articles')
				}
			},
		},
	]

	const listConfig = useMemo(() => ({
		...resolveListConfig(articlesListConfig, articlesCustomListConfig),
		onRowOpen: (row: any) => {
			void router.push(`/articles/${row.obj_content_id}?mode=edit`)
		},
	}), [router])

	return <GenericList config={listConfig} contextMenuBuilder={buildContextMenu} />
}
