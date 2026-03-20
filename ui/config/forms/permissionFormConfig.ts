import { FormConfig } from '../../types/formConfig'

export const permissionFormConfig: FormConfig = {
  width: 100,
  box: [
    {
      label: 'Permission Detail',
      width: 100,
      fields: [
        { field: 'name', width: 100, type: 'text' },
        { field: 'module', width: 50, type: 'text' },
        { field: 'action', width: 50, type: 'text' },
        { field: 'description', width: 100, type: 'moretext' },
      ],
    },
  ],
}
