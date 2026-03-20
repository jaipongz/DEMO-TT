export type LangMeta = { label: string; icon?: string; flag?: string }

export const masterConfig = {
  // Master dropdown options reused across modules
  lang: [
    { value: 'en', label: 'English', icon: '🇺🇸', flag: 'us' },
    { value: 'th', label: 'Thai', icon: '🇹🇭', flag: 'th' },
  ],
}

export const langOptions = masterConfig.lang

export const langLookup = masterConfig.lang.reduce<Record<string, LangMeta>>((acc, item) => {
  acc[item.value] = { label: item.label, icon: item.icon, flag: item.flag }
  return acc
}, {})
