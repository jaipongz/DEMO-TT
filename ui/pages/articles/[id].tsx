import { useMemo } from 'react'
import { useRouter } from 'next/router'
import GenericDetailForm from '../../components/forms/GenericDetailForm'
import { articlesFormConfig } from '../../config/forms/articlesFormConfig'
import { articlesCustomFormConfig } from '../../config/forms/custom/articlesCustomFormConfig'
import { resolveFormConfig } from '../../config/forms/resolveFormConfig'

export default function ArticleDetail() {
	const router = useRouter()
	const { id } = router.query
	const isNew = id === 'new'
	const modeParam = typeof router.query.mode === 'string' ? router.query.mode : undefined
	const mode = isNew ? 'add' : modeParam === 'view' ? 'view' : 'edit'
	const readOnly = mode === 'view'

	const formConfig = useMemo(() => resolveFormConfig(articlesFormConfig, articlesCustomFormConfig), [])

	return (
		<GenericDetailForm
			id={id}
			endpoint="/articles"
			isNew={isNew}
			formConfig={formConfig}
			initialData={{
				title: '',
				content: '',
				author: '',
				obj_lang: 'en',
				obj_state: 'draft',
			}}
			title={isNew ? 'Create Article' : readOnly ? 'View Article' : 'Edit Article'}
			subtitle={isNew ? 'Create a new article' : undefined}
			readOnly={readOnly}
			showBottomSaveBar={false}
		/>
	)
}
