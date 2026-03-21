import { ListConfig } from '../../types/listConfig'

const module_name = 'demo_jp_test'

export const demoJpTestListConfig: ListConfig = {
  title: 'Demo JP Test',
  endpoint: `/${module_name}`,
  serverSide: true,
  keywords: 'title,email,age,brand_color,published_date,published_at,category,province,article,home_banner_tags,status,flags,is_active,summary,content,thumbnail,intro_video,attachment',
  export: true,
  select: true,
  scroll: true,
  limit: 15,
  createHref: `/${module_name}/new?mode=add`,
  rowKey: 'demo_jp_test_id',
  columns: [
    { field: 'title', name: 'Title (text)', type: 'text', width: 140, sort: true },
    { field: 'email', name: 'Email (email)', type: 'text', width: 140, sort: true },
    { field: 'age', name: 'Age (number)', type: 'number', width: 140, sort: true },
    { field: 'brand_color', name: 'Brand Color (color)', type: 'text', width: 140, sort: true },
    { field: 'published_date', name: 'Published Date (date)', type: 'datetime', width: 140, sort: true },
    { field: 'published_at', name: 'Published At (datetime)', type: 'datetime', width: 140, sort: true },
    { field: 'category', name: 'Category (dropdown + lookup)', type: 'text', width: 140, sort: true },
    { field: 'province', name: 'Province (dynamic lookup)', type: 'text', width: 140, sort: true },
    { field: 'article', name: 'Article (dynamic lookup)', type: 'text', width: 140, sort: true },
    { field: 'home_banner_tags', name: 'Home Banner Tags (tag lookup)', type: 'text', width: 140, sort: true },
    { field: 'status', name: 'Status (radio + lookup)', type: 'text', width: 140, sort: true },
    { field: 'flags', name: 'Flags (checkbox + lookup)', type: 'text', width: 140, sort: true },
    { field: 'is_active', name: 'Is Active (switch)', type: 'boolean', width: 140, sort: true },
    { field: 'summary', name: 'Summary (moretext)', type: 'text', width: 140, sort: true },
    { field: 'content', name: 'Content (fulltext)', type: 'text', width: 140, sort: true },
    { field: 'thumbnail', name: 'Thumbnail (image)', type: 'text', width: 140, sort: true },
    { field: 'intro_video', name: 'Intro Video (video)', type: 'text', width: 140, sort: true },
    { field: 'attachment', name: 'Attachment (file)', type: 'text', width: 140, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'datetime', width: 140, sort: true },
  ],
}
