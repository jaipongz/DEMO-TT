import { ListConfig } from '../../../types/listConfig'

// Custom override for Articles list.
// Keep columns empty to fall back to default config. Add columns to override.
export const articlesCustomListConfig: ListConfig = {
  title: '',
  endpoint: '',
  columns: [],
}
