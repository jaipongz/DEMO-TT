import { FormConfig } from '../../types/formConfig'

export const homeBannerFormConfig: FormConfig = {
  width: 100,
  box: [
    {
      label: 'Home Banner Detail',
      width: 100,
      fields: [
        { field: 'title', name: 'Title', width: 50, type: 'text', required: true },
        {
          field: 'mode', name: 'Mode', width: 50, type: 'dropdown', required: true, lookup: {
            endpoint: '/home_banner/lookup',
            field: 'mode',
          }
        },
        { field: 'banner', name: 'Banner Image', width: 50, type: 'image', support: 'jpeg,jpg,png,webp', mode: { type: 'crop', width: 1920, height: 1080 } },
        { field: 'banner_video', name: 'Banner Video', width: 50, type: 'video', support: 'mp4,webm,ogg' },

      ],
    },
    {
      label: 'Home Banner Detail',
      width: 100,
      fields: [
        {
          width: 100,
          type: 'child',
          childConfig: {
            title: 'Home Banner Detail',
            columns: [
              { key: 'title', label: 'Title', width: '35%' },
              { key: 'file', label: 'Banner File', width: '35%' },
            ],
            fields: [
              { field: 'title', name: 'Title', width: 100, type: 'text', required: true },
              { field: 'file', name: 'Banner File', width: 100, type: 'file', support: 'jpeg,jpg,png,webp,mp4,webm,ogg', mode: { type: 'crop', width: 1920, height: 1080 } },
              { field: 'detail', name: 'Detail', width: 100, type: 'fulltext', required: false },

            ],
          },

        }],
    }, {
      label: 'Home banner gallery',
      width: 100,
      type: 'gallery',
      maxSize: 10,// size per file by MB
      support: 'jpeg,jpg,png,webp', // or 'mp4,webm,ogg' for video gallery or mode:'mixed' for mixed gallery and disable crop for video and add  mode:'image' for image and mode:'video' for video in childConfig.fields to support both in same gallery
      mode: { mode: 'image', type: 'crop', width: 1920, height: 1080 },// or { type: 'scaledown' } and add mode:'video' for video gallery 


    }
  ],
}
