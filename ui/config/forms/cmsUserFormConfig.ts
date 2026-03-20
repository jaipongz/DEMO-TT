import { FormConfig } from '../../types/formConfig'

export const cmsUserFormConfig: FormConfig = {
  width: 100,
  box: [
    {
      label: 'User Detail',
      width: 100,
      fields: [
        { field: 'email', width: 100, type: 'text' },
        { field: 'name', width: 100, type: 'text' },
        { field: 'password', width: 100, type: 'text' },
      ],
    },
  ],
}
