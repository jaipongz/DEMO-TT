import { useMemo } from 'react'
import { useRouter } from 'next/router'
import GenericDetailForm from '../../components/forms/GenericDetailForm'
import { demoJpTestFormConfig } from '../../config/forms/demoJpTestFormConfig'
import { demoJpTestCustomFormConfig } from '../../config/forms/custom/demoJpTestCustomFormConfig'
import { resolveFormConfig } from '../../config/forms/resolveFormConfig'

const module_name = 'demo_jp_test'

export default function DemoJpTestDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const isNew = id === 'new'
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : undefined
  const mode = isNew ? 'add' : modeParam === 'view' ? 'view' : 'edit'
  const readOnly = mode === 'view'

  const formConfig = useMemo(() => resolveFormConfig(demoJpTestFormConfig, demoJpTestCustomFormConfig), [])

  return (
    <GenericDetailForm
      id={id}
      endpoint={`/${module_name}`}
      isNew={isNew}
      formConfig={formConfig}
      initialData={undefined}
      title={isNew ? 'Create Demo JP Test' : readOnly ? 'View Demo JP Test' : 'Edit Demo JP Test'}
      readOnly={readOnly}
      showBottomSaveBar={false}
    />
  )
}
