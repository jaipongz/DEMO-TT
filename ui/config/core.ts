export type LangMeta = { label: string; icon?: string; flag?: string }

export const masterConfig = {
  // Master dropdown options reused across modules
  lang: [
    { value: 'en', label: 'English', icon: '🇺🇸', flag: 'us' },
    { value: 'th', label: 'Thai', icon: '🇹🇭', flag: 'th' },
    { value: 'cn', label: 'Chinese', icon: '🇨🇳', flag: 'cn' },
    { value: 'jp', label: 'Japanese', icon: '🇯🇵', flag: 'jp' },
    { value: 'kr', label: 'Korean', icon: '🇰🇷', flag: 'kr' },
  ],
  // Display locales are restricted to languages the UI actively supports
  displayLocale: [
    { value: 'en', label: 'English', icon: '🇺🇸', flag: 'us' },
    { value: 'th', label: 'Thai', icon: '🇹🇭', flag: 'th' },
  ],
}

export const langOptions = masterConfig.lang
export const displayLocaleOptions = masterConfig.displayLocale

export const langLookup = masterConfig.lang.reduce<Record<string, LangMeta>>((acc, item) => {
  acc[item.value] = { label: item.label, icon: item.icon, flag: item.flag }
  return acc
}, {})
