import { ListConfig } from '../../types/listConfig'
const module_name = 'articles'
export const articlesListConfig: ListConfig = {
  title: 'Articles',
  endpoint: `/${module_name}`,
  filter: 'title,author',
  filters: [
    { key: 'obj_lang', label: 'Language', lookup: { endpoint: '/articles/lookup', field: 'obj_lang' } },
  ],
  export: true,
  select: true,
  scroll: true,
  limit: 15,
  createHref: `/${module_name}/new?mode=add`,
  rowKey: 'id',
  columns: [
    { field: 'thumbnail', name: 'Thumbnail', type: 'image', width: 120, sort: false },
    { field: 'title', name: 'Title', type: 'text', width: 120, sort: true },
    { field: 'author', name: 'Author', type: 'text', width: 100, sort: true },
    { field: 'obj_state', name: 'Status', type: 'text', width: 70, sort: true },
    { field: 'obj_lang', name: 'Language', type: 'text', width: 70, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'date', width: 70, sort: true },
  ],
}
