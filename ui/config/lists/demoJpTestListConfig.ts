import { ListConfig } from '../../types/listConfig'

export const demoJpTestListConfig: ListConfig = {
  title: 'Demo JP Test',
  endpoint: '/demo_jp_test',
  serverSide: true,
  keywords: 'title,category,status',
  filters: [
    {
      key: 'category',
      label: 'Category',
      lookup: {
        endpoint: '/demo_jp_test/lookup',
        field: 'category',
      },
    },
  ],
  export: true,
  select: true,
  scroll: true,
  limit: 15,
  createHref: '/demo_jp_test/new?mode=add',
  rowKey: 'demo_jp_test_id',
  columns: [
    { field: 'thumbnail', name: 'Thumbnail', type: 'image', width: 120, sort: false },
    { field: 'title', name: 'Title', type: 'text', width: 120, sort: true },
    { field: 'category', name: 'Category', type: 'text', width: 120, sort: true },
    { field: 'obj_state', name: 'Status', type: 'text', width: 100, sort: true },
    { field: 'obj_lang', name: 'Language', type: 'text', width: 90, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'datetime', width: 140, sort: true },
  ],
}
