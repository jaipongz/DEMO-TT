export interface ModuleConfig {
    id: string
    label: string
    href?: string
    children?: ModuleConfig[]
}

export const modules: ModuleConfig[] = [
    // {
    //     id: 'articles', // Example module, you can replace it with your actual modules
    //     label: 'Articles', // Display name for the module
    //     href: '/articles', // URL path to navigate to when the module is clicked
    // },
    {id:'article', label:'Article', href:'/article'},
    {
        id: 'demo_jp',
        label: 'Demo JP',
        href: '/demo_jp',
    },
    {
        id: 'demo_jp_test',
        label: 'Demo JP Test',
        href: '/demo_jp_test',
    },
    {
        id: 'admin',
        label: 'Admin',
        children: [
            {
                id: 'site-settings',
                label: 'Site Settings',
                href: '/site-settings',
            },
            {
                id: 'wcm-user',
                label: 'CMS Users',
                href: '/wcm-user',
            },
            {
                id: 'wcm-role',
                label: 'Roles',
                href: '/wcm-role',
            },
        ],
    },


]
