import { ListConfig } from '../../types/listConfig'

const module_name = 'home_banner'

export const homeBannerListConfig: ListConfig = {
  title: 'Home Banner',
  endpoint: `/${module_name}`,
  filter: 'title,mode',
  filters: [
    {
      key: 'mode', label: 'Mode', lookup: {
        endpoint: `/${module_name}/lookup`,
        field: 'mode',
      }
    },
  ],
  export: true,
  select: true,
  scroll: true,
  limit: 10,
  createHref: `/${module_name}/new?mode=add`,
  rowKey: 'homeBannerId',
  columns: [
    { field: 'title', name: 'Title', type: 'text', width: 220, sort: true },
    { field: 'mode', name: 'Mode', type: 'text', width: 100, sort: true },
    { field: 'obj_state', name: 'State', type: 'text', width: 100, sort: true },
    { field: 'obj_lang', name: 'Language', type: 'text', width: 90, sort: true },
    { field: 'obj_modified_date', name: 'Updated', type: 'datetime', width: 140, sort: true },
  ],
}
