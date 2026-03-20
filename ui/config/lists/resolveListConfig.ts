import { ListConfig } from '../../types/listConfig'

export function resolveListConfig(defaultConfig: ListConfig, customConfig?: ListConfig): ListConfig {
  const hasCustom = Boolean(
    customConfig &&
    Array.isArray(customConfig.columns) &&
    customConfig.columns.length > 0
  )

  return hasCustom ? customConfig! : defaultConfig
}
