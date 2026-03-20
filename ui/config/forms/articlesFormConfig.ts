import { FormConfig } from '../../types/formConfig'

export const articlesFormConfig: FormConfig = {
  width: 100,
  box: [
    {
      label: 'Article Detail',
      width: 100,
      fields: [
        { field: 'thumbnail', name: 'Thumbnail', width: 50, type: 'image', support: 'jpeg,jpg,png,gif', required: false, mode: { type: 'crop', width: 1200, height: 720 } },
        { field: 'video', name: 'Video', width: 50, type: 'video', support: 'mp4,webm,ogg' },
        { field: 'document', name: 'Document', width: 100, type: 'file', support: 'pdf,doc,docx,xls,xlsx,ppt,pptx,zip' },
        { field: 'title', name: 'Title', width: 100, type: 'text', required: true },
        { field: 'author', name: 'Author', width: 50, type: 'text' },
        { field: 'date', name: 'Date', width: 50, type: 'date' },
        { field: 'content', name: 'Content', width: 100, type: 'moretext', required: true },
        { field: 'content-wysiwyg', name: 'Content (WYSIWYG)', width: 100, type: 'fulltext' },
        { field: 'featured', name: 'Featured', width: 25, type: 'switch' },
        // { field: 'brandColor', name: 'Brand Color', width: 25, type: 'color' },
        // { field: 'email', name: 'Email', width: 75, type: 'email' },
        // { field: 'age', name: 'Age', width: 25, type: 'number' },
        // { field: 'thumbnail', name: 'Thumbnail', width: 25, type: 'image', support: 'jpeg,jpg,png,gif', required: true, mode: { type: 'crop', width: 200, height: 720 } },
        // { field: 'thumbnail', name: 'Thumbnail', width: 75, type: 'image', support: 'jpeg,jpg,png,gif', required: true, mode: { type: 'scaledown' } }
      ],
    },{
      label: '',
      width: 100,
      fields: [
        {
          width: 100,
          type: 'child',
          childConfig: {
            title: 'Article Detail',
            columns: [
              { key: 'title', label: 'Title', width: '35%' },
              { key: 'detail', label: 'Detail', width: '35%' },
            ],
            fields: [
              { field: 'title', name: 'Title', width: 100, type: 'text', required: true },
              { field: 'detail', name: 'Detail', width: 100, type: 'fulltext', required: true }, 
            ],
          },

        }],
    }
  ],
}
