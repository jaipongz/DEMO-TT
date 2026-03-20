import { ListConfig } from '../../types/listConfig'

const module_name = 'demo_jp'

export const demoJpListConfig: ListConfig = {
  title: 'Demo JP',
  endpoint: `/${module_name}`,
  serverSide: true,
  keywords: 'title,email,category,status',
  filters: [
    {
      key: 'category',
      label: 'Category',
      lookup: {
        endpoint: `/${module_name}/lookup`,
        field: 'category',
      },
    },
   
  ],
  export: true,
  select: true,
  scroll: true,
  limit: 15,
  createHref: `/${module_name}/new?mode=add`,
  rowKey: 'demo_jp_id',
  columns: [
    { field: 'thumbnail', name: 'Thumbnail', type: 'image', width: 120, sort: false },
    { field: 'title', name: 'Title', type: 'text', width: 120, sort: true },
    { field: 'category', name: 'Category', type: 'text', width: 120, sort: true },
    { field: 'obj_state', name: 'State', type: 'text', width: 100, sort: true },
    { field: 'obj_lang', name: 'Language', type: 'text', width: 90, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'datetime', width: 140, sort: true },
  ],
}
