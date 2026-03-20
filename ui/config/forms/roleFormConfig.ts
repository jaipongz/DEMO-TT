import { FormConfig } from '../../types/formConfig'

export const roleFormConfig: FormConfig = {
  width: 100,
  box: [
    {
      label: 'Role Detail',
      width: 100,
      fields: [
        { field: 'name', width: 100, type: 'text' },
        { field: 'description', width: 100, type: 'moretext' },
      ],
    },
  ],
}
