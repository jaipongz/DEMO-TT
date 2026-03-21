import { FormConfig } from '../../types/formConfig'

export const demoJpTestFormConfig: FormConfig = {
  width: 100,
  master_field: 'title',
  box: [
    {
      label: 'Demo JP - Lookup Fields',
      width: 50,
      fields: [
        {
          field: 'category',
          name: 'Category (dropdown + lookup)',
          width: 100,
          type: 'dropdown',
          required: true,
          lookup: {
            endpoint: '/demo_jp_test/lookup',
            field: 'category',
          },
        },
        {
          field: 'province',
          name: 'Province (dynamic lookup)',
          width: 100,
          type: 'dropdown',
          required: true,
          lookup: {
            endpoint: '/demo_jp_test/lookup',
            field: 'province',
          },
          search: true,
        },
        {
          field: 'article',
          name: 'Article (dynamic lookup)',
          width: 100,
          type: 'dropdown',
          required: false,
          lookup: {
            endpoint: '/demo_jp_test/lookup',
            field: 'article',
          },
          search: true,
        },
        {
          field: 'home_banner_tags',
          name: 'Home Banner Tags (tag lookup)',
          width: 100,
          type: 'tag',
          required: false,
          lookup: {
            endpoint: '/demo_jp_test/lookup',
            field: 'home_banner',
          },
          search: true,
        },
        {
          field: 'status',
          name: 'Status (radio + lookup)',
          width: 50,
          type: 'radio',
          required: false,
          lookup: {
            endpoint: '/demo_jp_test/lookup',
            field: 'status',
          },
        },
        {
          field: 'flags',
          name: 'Flags (checkbox + lookup)',
          width: 50,
          type: 'checkbox',
          required: false,
          lookup: {
            endpoint: '/demo_jp_test/lookup',
            field: 'flags',
          },
        },
        {
          field: 'is_active',
          name: 'Is Active (switch)',
          width: 100,
          type: 'switch',
          required: false,
          options: [
            {
              label: 'Active',
              value: 'true',
            },
            {
              label: 'Inactive',
              value: 'false',
            },
          ],
        },
      ],
    },
    {
      label: 'Demo JP - Primitive Types',
      width: 50,
      fields: [
        { field: 'title', name: 'Title (text)', width: 100, type: 'text', required: true },
        { field: 'email', name: 'Email (email)', width: 50, type: 'email', required: false },
        { field: 'age', name: 'Age (number)', width: 50, type: 'number', required: false },
        { field: 'brand_color', name: 'Brand Color (color)', width: 100, type: 'color', required: false },
        { field: 'published_date', name: 'Published Date (date)', width: 100, type: 'date', required: false },
        { field: 'published_at', name: 'Published At (datetime)', width: 100, type: 'datetime', required: false },
      ],
    },
    {
      label: 'Demo JP - Content Fields',
      width: 100,
      fields: [
        { field: 'summary', name: 'Summary (moretext)', width: 100, type: 'moretext', required: false },
        { field: 'content', name: 'Content (fulltext)', width: 100, type: 'fulltext', required: false },
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
          required: false,
          support: 'jpeg,jpg,png,webp',
          mode: {
            type: 'crop',
            width: 1200,
            height: 720,
          },
        },
        { field: 'intro_video', name: 'Intro Video (video)', width: 50, type: 'video', required: false, support: 'mp4,webm,ogg' },
        { field: 'attachment', name: 'Attachment (file)', width: 100, type: 'file', required: false, support: 'pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt,csv' },
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
              {
                key: 'title',
                label: 'Title',
                width: '28%',
              },
              {
                key: 'file',
                label: 'File',
                width: '33%',
              },
              {
                key: 'detail',
                label: 'Detail',
                width: '40%',
              },
            ],
            fields: [
              { field: 'title', name: 'Title', width: 100, type: 'text', required: true },
              { field: 'file', name: 'File', width: 100, type: 'file', required: false, support: 'jpeg,jpg,png,webp,mp4,webm,ogg,pdf,doc,docx' },
              { field: 'detail', name: 'Detail', width: 100, type: 'fulltext', required: false },
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
      mode: {
        mode: 'mixed',
        type: 'scaledown',
      },
    },
    {
      label: 'Demo JP Gallery',
      field: '__gallery_korea_gallery',
      width: 100,
      type: 'gallery',
      maxSize: 50,
      support: 'jpeg,jpg,png,webp,mp4,webm,ogg',
      mode: {
        mode: 'mixed',
        type: 'scaledown',
      },
    },
  ],
}
