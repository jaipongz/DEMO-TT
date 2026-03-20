import { useRouter } from 'next/router'
import GenericDetailForm from '../../components/forms/GenericDetailForm'
import { dynamicSampleFormConfig } from '../../config/forms/dynamicSampleFormConfig'

export default function DynamicSampleDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const isNew = id === 'new'
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : undefined
  const mode = isNew ? 'add' : modeParam === 'view' ? 'view' : 'edit'
  const readOnly = mode === 'view'

  return (
    <GenericDetailForm
      id={id}
      endpoint="/articles"
      isNew={isNew}
      formConfig={dynamicSampleFormConfig}
      initialData={{
        title: '',
        author: '',
        date: '',
        content: '',
        featured: false,
        status: 'draft',
        thumbnail: null,
        obj_lang: 'en',
      }}
      title={isNew ? 'Create Dynamic Sample' : readOnly ? 'View Dynamic Sample' : 'Edit Dynamic Sample'}
      subtitle="Config-driven module built with GenericList + GenericDetailForm"
      readOnly={readOnly}
      showBottomSaveBar={false}
    />
  )
}
