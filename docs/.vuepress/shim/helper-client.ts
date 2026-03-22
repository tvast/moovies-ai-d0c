import { resolveRoute as baseResolveRoute } from 'vuepress/client'
import * as helper from '@vuepress/helper/dist/client/index.js'

// VuePress 2 rc.125 client build lacks resolveRoute; provide a compatible wrapper
export const resolveRoute = (path: string, current?: string) => {
  const FAKE_HOST = 'http://.'
  const isAbsolute = /^https?:\/\//.test(path) || path.startsWith('//')
  if (isAbsolute || typeof current !== 'string') return baseResolveRoute(path)
  const loc = current.slice(0, current.lastIndexOf('/'))
  return baseResolveRoute(new URL(`${loc}/${encodeURI(path)}`, FAKE_HOST).pathname)
}

export * from '@vuepress/helper/dist/client/index.js'
