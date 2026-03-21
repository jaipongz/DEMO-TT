import { FormConfig } from '../../types/formConfig'

export const articleFormConfig: FormConfig = {
  width: 100,
  master_field: 'title',
  box: [
    {
      label: 'Details',
      width: 100,
      fields: [
        { field: 'title', name: 'Title', width: 100, type: 'text', required: true },
        { field: 'short_description', name: 'Short Description', width: 100, type: 'moretext', required: false },
        {
          field: 'thumbnail',
          name: 'Thumbnail (image)',
          width: 100,
          type: 'image',
          required: false,
          support: 'jpeg,jpg,png,webp',
          mode: {
            type: 'crop',
            width: 1200,
            height: 720,
          },
        },
      ],
    },
  ],
}
