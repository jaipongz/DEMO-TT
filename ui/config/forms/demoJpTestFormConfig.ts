import { FormConfig } from '../../types/formConfig'

const module_name = 'demo_jp_test'

export const demoJpTestFormConfig: FormConfig = {
  width: 100,
  master_field: 'title',
  box: [
    {
      label: 'Demo JP Test',
      width: 100,
      fields: [
        { field: 'title', name: 'Title (text)', width: 100, type: 'text', required: true },
        { field: 'email', name: 'Email (email)', width: 100, type: 'email' },
        { field: 'age', name: 'Age (number)', width: 100, type: 'number' },
        { field: 'brand_color', name: 'Brand Color (color)', width: 100, type: 'text' },
        { field: 'published_date', name: 'Published Date (date)', width: 100, type: 'date' },
        { field: 'published_at', name: 'Published At (datetime)', width: 100, type: 'datetime' },
        { field: 'category', name: 'Category (dropdown + lookup)', width: 100, type: 'dropdown', required: true },
        { field: 'province', name: 'Province (dynamic lookup)', width: 100, type: 'dropdown', required: true },
        { field: 'article', name: 'Article (dynamic lookup)', width: 100, type: 'dropdown' },
        { field: 'home_banner_tags', name: 'Home Banner Tags (tag lookup)', width: 100, type: 'tag' },
        { field: 'status', name: 'Status (radio + lookup)', width: 100, type: 'radio' },
        { field: 'flags', name: 'Flags (checkbox + lookup)', width: 100, type: 'checkbox' },
        { field: 'is_active', name: 'Is Active (switch)', width: 100, type: 'switch' },
        { field: 'summary', name: 'Summary (moretext)', width: 100, type: 'moretext' },
        { field: 'content', name: 'Content (fulltext)', width: 100, type: 'fulltext' },
        { field: 'thumbnail', name: 'Thumbnail (image)', width: 100, type: 'text' },
        { field: 'intro_video', name: 'Intro Video (video)', width: 100, type: 'text' },
        { field: 'attachment', name: 'Attachment (file)', width: 100, type: 'text' },
      ],
    },
  ],
}
