import { ListConfig } from '../../types/listConfig'

export const wcmRoleListConfig: ListConfig = {
  title: 'CMS Roles',
  endpoint: '/wcm-roles',
  search: {
    placeholder: 'Search roles...',
    fields: ['name', 'description'],
  },
  select: true,
  rowKey: 'id',
  createHref: '/wcm-role/new',
  columns: [
    { field: 'id', name: 'ID', width: 90 },
    { field: 'name', name: 'Name', width: 220 },
    { field: 'description', name: 'Description', width: 420 },
    {
      field: 'createdAt',
      name: 'Created',
      type: 'datetime',
      width: 180,
      sort: true,
    },
  ],
}
