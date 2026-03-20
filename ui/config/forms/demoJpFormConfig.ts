import { FormConfig } from '../../types/formConfig'

const module_name = 'demo_jp'

export const demoJpFormConfig: FormConfig = {
  width: 100,
  master_field: 'title',
  box: [
    {
      label: 'Demo JP - Primitive Types',
      width: 50,
      fields: [
        { field: 'title', name: 'Title (text)', width: 100, type: 'text', required: true },
        { field: 'email', name: 'Email (email)', width: 50, type: 'email' },
        { field: 'age', name: 'Age (number)', width: 50, type: 'number' },
        { field: 'brand_color', name: 'Brand Color (color)', width: 100, type: 'color' },

        { field: 'published_date', name: 'Published Date (date)', width: 100, type: 'date' },
        { field: 'published_at', name: 'Published At (datetime)', width: 100, type: 'datetime' },
      ],
    },
    {
      label: 'Demo JP - Lookup Fields', width: 50, fields: [
        {
          field: 'category',
          name: 'Category (dropdown + lookup)',
          width: 100,
          type: 'dropdown',
          lookup: { endpoint: `/${module_name}/lookup`, field: 'category' },
          required: true,
        },
        {
          field: 'province',
          name: 'Province (dynamic lookup)',
          width: 100,
          type: 'dropdown',
          search: true,
          lookup: { endpoint: `/${module_name}/lookup`, field: 'province' },
          required: true,
        },
        {
          field: 'article',
          name: 'Article (dynamic lookup)',
          width: 100,
          type: 'dropdown',
          search: true,
          lookup: { endpoint: `/${module_name}/lookup`, field: 'article' },
          required: false,
        },
        {
          field: 'home_banner_tags',
          name: 'Home Banner Tags (tag lookup)',
          width: 100,
          type: 'tag',
          search: true,
          lookup: { endpoint: `/${module_name}/lookup`, field: 'home_banner' },
        },
        {
          field: 'status',
          name: 'Status (radio + lookup)',
          width: 50,
          type: 'radio',
          lookup: { endpoint: `/${module_name}/lookup`, field: 'status' },
        },
        {
          field: 'flags',
          name: 'Flags (checkbox + lookup)',
          width: 50,
          type: 'checkbox',
          lookup: { endpoint: `/${module_name}/lookup`, field: 'flags' },
        },
        {
          field: 'is_active',
          name: 'Is Active (switch)',
          width: 100,
          type: 'switch',
          options: [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ],
        },
      ]
    },
    {
      label: 'Demo JP - Content Fields',
      width: 100,
      fields: [
        { field: 'summary', name: 'Summary (moretext)', width: 100, type: 'moretext' },
        { field: 'content', name: 'Content (fulltext)', width: 100, type: 'fulltext' },
      ],
    },
    {
      label: 'Demo JP - Media Files',
      width: 100,
      fields: [
        {
          field: 'thumbnail',
          name: 'Thumbnail (image)',
          width: 50,
          type: 'image',
          support: 'jpeg,jpg,png,webp',
          mode: { type: 'crop', width: 1200, height: 720 },
        },
        {
          field: 'intro_video',
          name: 'Intro Video (video)',
          width: 50,
          type: 'video',
          support: 'mp4,webm,ogg',
        },
        {
          field: 'attachment',
          name: 'Attachment (file)',
          width: 100,
          type: 'file',
          support: 'pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt,csv',
        },
      ],
    },
    {
      label: 'Demo JP Child List',
      width: 100,
      fields: [
        {
          width: 100,
          type: 'child',
          childConfig: {
            title: 'Demo JP Child List',
            columns: [
              { key: 'title', label: 'Title', width: '30%' },
              { key: 'file', label: 'File', width: '35%' },
              { key: 'detail', label: 'Detail', width: '35%' },
            ],
            fields: [
              { field: 'title', name: 'Title', width: 100, type: 'text', required: true },
              {
                field: 'file',
                name: 'File',
                width: 100,
                type: 'file',
                support: 'jpeg,jpg,png,webp,mp4,webm,ogg,pdf,doc,docx',
              },
              { field: 'detail', name: 'Detail', width: 100, type: 'fulltext' },
            ],
          },
        },
      ],
    },
    {
      label: 'Demo JP Gallery',
      field: '__gallery_demo_jp_gallery',
      width: 100,
      type: 'gallery',
      maxSize: 50,
      support: 'jpeg,jpg,png,webp,mp4,webm,ogg',
      mode: { mode: 'mixed', type: 'scaledown' },
    },
    {
      label: 'Korea Gallery',
      field: '__gallery_korea_gallery',
      width: 100,
      type: 'gallery',
      maxSize: 50,
      support: 'jpeg,jpg,png,webp,mp4,webm,ogg',
      mode: { mode: 'mixed', type: 'scaledown' },
    },
  ],
}
