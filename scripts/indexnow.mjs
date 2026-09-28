/**
 * Submits every public URL to Bing, Yandex and Ask via the IndexNow protocol.
 * The key file is served from `public/` at the site root.
 *
 *   npm run submit:indexnow
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

const KEY = '22dfff19cb64561aee3dbc700a738586'
const HOST = 'shehzadbashir.xyz'
const BASE = `https://${HOST}`

const siteSource = readFileSync(path.resolve('src/config/site.ts'), 'utf8')
const toolBlock = siteSource.match(/export const TOOL_SLUGS = \[([\s\S]*?)\] as const/)
if (!toolBlock) throw new Error('TOOL_SLUGS not found in src/config/site.ts')
const slugs = [...toolBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1])

const urlList = [
  `${BASE}/`,
  ...slugs.map((slug) => `${BASE}/${slug}`),
  `${BASE}/privacy`,
  `${BASE}/terms`,
]

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyUrl: `${BASE}/${KEY}.txt`,
    urlList,
  }),
})

console.log(`IndexNow ${response.status} ${response.statusText} for ${urlList.length} URLs`)
console.log(urlList.join('\n'))
if (!response.ok) console.log(await response.text())
process.exit(response.ok ? 0 : 1)
