export interface ModuleConfig {
    id: string
    label: string
    href?: string
    children?: ModuleConfig[]
}

export const modules: ModuleConfig[] = [
    {
        id: 'articles',
        label: 'Articles',
        href: '/articles',
    },
    {
        id: 'home_banner',
        label: 'Home Banner',
        href: '/home_banner',
    },
    {
        id: 'demo_jp',
        label: 'Demo JP',
        href: '/demo_jp',
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
