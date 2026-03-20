import { useMemo } from 'react'
import { useRouter } from 'next/router'
import GenericDetailForm from '../../components/forms/GenericDetailForm'
import { homeBannerFormConfig } from '../../config/forms/homeBannerFormConfig'
import { homeBannerCustomFormConfig } from '../../config/forms/custom/homeBannerCustomFormConfig'
import { resolveFormConfig } from '../../config/forms/resolveFormConfig'

const module_name = 'home_banner'

export default function HomeBannerDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const isNew = id === 'new'
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : undefined
  const mode = isNew ? 'add' : modeParam === 'view' ? 'view' : 'edit'
  const readOnly = mode === 'view'

  const formConfig = useMemo(() => resolveFormConfig(homeBannerFormConfig, homeBannerCustomFormConfig), [])

  return (
    <GenericDetailForm
      id={id}
      endpoint={`/${module_name}`}
      isNew={isNew}
      formConfig={formConfig}
      initialData={{
        title: '',
        mode: 'image',
        banner: '',
        banner_video: '',
        child_file: [],
        obj_lang: 'en',
        obj_state: 'draft',
      }}
      title={isNew ? 'Create Home Banner' : readOnly ? 'View Home Banner' : 'Edit Home Banner'}
      subtitle={isNew ? 'Create a new home banner' : undefined}
      readOnly={readOnly}
      showBottomSaveBar={false}
    />
  )
}
