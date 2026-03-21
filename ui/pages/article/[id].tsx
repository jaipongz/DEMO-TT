import { useMemo } from 'react'
import { useRouter } from 'next/router'
import GenericDetailForm from '../../components/forms/GenericDetailForm'
import { articleFormConfig } from '../../config/forms/articleFormConfig'
import { articleCustomFormConfig } from '../../config/forms/custom/articleCustomFormConfig'
import { resolveFormConfig } from '../../config/forms/resolveFormConfig'

const module_name = 'article'

export default function ArticleDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const isNew = id === 'new'
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : undefined
  const mode = isNew ? 'add' : modeParam === 'view' ? 'view' : 'edit'
  const readOnly = mode === 'view'

  const formConfig = useMemo(() => resolveFormConfig(articleFormConfig, articleCustomFormConfig), [])

  return (
    <GenericDetailForm
      id={id}
      endpoint={`/${module_name}`}
      isNew={isNew}
      formConfig={formConfig}
      initialData={undefined}
      title={isNew ? 'Create Article' : readOnly ? 'View Article' : 'Edit Article'}
      readOnly={readOnly}
      showBottomSaveBar={false}
    />
  )
}
