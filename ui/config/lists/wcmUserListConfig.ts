import { ListConfig } from '../../types/listConfig'

export const wcmUserListConfig: ListConfig = {
  title: 'CMS Users',
  endpoint: '/wcm-users',
  search: {
    placeholder: 'Search users...',
    fields: ['email', 'name', 'firstname', 'lastname'],
  },
  filters: [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ],
  select: true,
  rowKey: 'id',
  createHref: '/wcm-user/new',
  columns: [
    { field: 'id', name: 'ID', width: 80 },
    {
      field: 'name',
      name: 'Name',
      width: 220,
      render: (_value, row) => `${row.firstname || ''} ${row.lastname || ''}`.trim() || row.name || '-',
    },
    { field: 'email', name: 'Email', width: 280 },
    {
      field: 'roles',
      name: 'Roles',
      width: 240,
      render: (value) =>
        Array.isArray(value) && value.length > 0
          ? value.map((role: any) => role.name).join(', ')
          : '-',
    },
    {
      field: 'isActive',
      name: 'Status',
      width: 120,
      render: (_value, row) => {
        const active = !!row?.isActive
        return active ? 'Active' : 'Inactive'
      },
    },
    {
      field: 'createdAt',
      name: 'Created',
      type: 'datetime',
      width: 180,
      sort: true,
    },
  ],
}
