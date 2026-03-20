import { useMemo } from 'react'
import { useRouter } from 'next/router'
import GenericDetailForm from '../../components/forms/GenericDetailForm'
import { demoJpFormConfig } from '../../config/forms/demoJpFormConfig'
import { demoJpCustomFormConfig } from '../../config/forms/custom/demoJpCustomFormConfig'
import { resolveFormConfig } from '../../config/forms/resolveFormConfig'

const module_name = 'demo_jp'

export default function DemoJpDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const isNew = id === 'new'
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : undefined
  const mode = isNew ? 'add' : modeParam === 'view' ? 'view' : 'edit'
  const readOnly = mode === 'view'

  const formConfig = useMemo(() => resolveFormConfig(demoJpFormConfig, demoJpCustomFormConfig), [])

  return (
    <GenericDetailForm
      id={id}
      endpoint={`/${module_name}`}
      isNew={isNew}
      formConfig={formConfig}
      initialData={{
        title: '',
        email: '',
        age: '',
        brand_color: '#2563eb',
        category: 'news',
        status: 'draft',
        flags: [],
        is_active: false,
        published_date: '',
        published_at: '',
        summary: '',
        content: '',
        thumbnail: '',
        intro_video: '',
        attachment: '',
        obj_lang: 'en',
        obj_state: 'draft',
      }}
      title={isNew ? 'Create Demo JP' : readOnly ? 'View Demo JP' : 'Edit Demo JP'}
      subtitle={isNew ? 'Master template module using all dynamic field types' : undefined}
      readOnly={readOnly}
      showBottomSaveBar={false}
    />
  )
}
