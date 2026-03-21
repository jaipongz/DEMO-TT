import { ListConfig } from '../../types/listConfig'

export const articleListConfig: ListConfig = {
  title: 'Article',
  endpoint: '/article',
  serverSide: true,
  keywords: 'title,short_description',
  export: true,
  select: true,
  scroll: true,
  limit: 15,
  createHref: '/article/new?mode=add',
  rowKey: 'articleId',
  columns: [
    { field: 'thumbnail', name: 'Thumbnail', type: 'image', width: 120, sort: false },
    { field: 'title', name: 'Title', type: 'text', width: 120, sort: true },
    { field: 'obj_state', name: 'Status', type: 'text', width: 100, sort: true },
    { field: 'obj_lang', name: 'Language', type: 'text', width: 90, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'datetime', width: 140, sort: true },
  ],
}
