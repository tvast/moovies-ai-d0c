import * as helper from '@vuepress/helper/dist/node/index.js'

// Ensure getFullLocaleConfig exists for plugins expecting it (missing in rc.26)
export const getFullLocaleConfig = helper.getFullLocaleConfig ?? (({
  default: defaults = [],
  config = {},
}: {
  default?: [string[], Record<string, any>][]
  config?: Record<string, Record<string, any>>
}) => {
  const locales: Record<string, Record<string, any>> = {}
  for (const [langs, value] of defaults) {
    for (const lang of langs) {
      locales[lang] = { ...(locales[lang] || {}), ...value }
    }
  }
  for (const [lang, value] of Object.entries(config)) {
    locales[lang] = { ...(locales[lang] || {}), ...value }
  }
  return locales
})

export * from '@vuepress/helper/dist/node/index.js'
