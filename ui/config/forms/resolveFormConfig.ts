import { FormConfig } from '../../types/formConfig'

export function resolveFormConfig(defaultConfig: FormConfig, customConfig?: FormConfig): FormConfig {
  const hasCustom = Boolean(
    customConfig &&
    Array.isArray(customConfig.box) &&
    customConfig.box.some((box) => ('fields' in box ? Array.isArray(box.fields) && box.fields.length > 0 : box.type === 'gallery'))
  )

  return hasCustom ? customConfig! : defaultConfig
}
