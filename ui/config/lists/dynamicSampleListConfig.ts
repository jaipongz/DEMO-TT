import { ListConfig } from '../../types/listConfig'

export const dynamicSampleListConfig: ListConfig = {
  title: 'Dynamic Sample',
  endpoint: '/articles',
  filter: 'title,author',
  filters: [
    { key: 'obj_lang', label: 'Language', lookup: { endpoint: '/articles/lookup', field: 'obj_lang' } },
  ],
  export: true,
  select: true,
  scroll: true,
  limit: 15,
  createHref: '/dynamic-sample/new?mode=add',
  rowKey: 'obj_content_id',
  columns: [
    { field: 'obj_content_id', name: 'ID', type: 'text', width: 80, sort: true },
    { field: 'title', name: 'Title', type: 'text', width: 200, sort: true },
    { field: 'author', name: 'Author', type: 'text', width: 140, sort: true },
    { field: 'obj_state', name: 'Status', type: 'text', width: 110, sort: true },
    { field: 'obj_lang', name: 'Language', type: 'text', width: 90, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'date', width: 140, sort: true },
  ],
}
