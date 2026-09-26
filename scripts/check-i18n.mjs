import fs from 'node:fs'

function load(file) {
  let s = fs.readFileSync(file, 'utf8')
  s = s.replace(/^import .*$/gm, '')
  s = s.replace(/^export type .*$/gm, '')
  s = s.replace(/export const (\w+)(: \w+)? =/g, 'const $1 =')
  s = s.replace(/ as const/g, '')
  const name = file.includes('ur') ? 'ur' : file.includes('ar') ? 'ar' : 'en'
  return new Function(`${s}; return ${name}`)()
}

function paths(obj, prefix = '', acc = new Set()) {
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') paths(value, path, acc)
    else acc.add(path)
  }
  return acc
}

const base = paths(load('src/i18n/en.ts'))
console.log('en keys:', base.size)
for (const lang of ['ur', 'ar']) {
  const current = paths(load(`src/i18n/${lang}.ts`))
  const missing = [...base].filter((k) => !current.has(k))
  const extra = [...current].filter((k) => !base.has(k))
  console.log(`${lang}: missing ${missing.length}`, missing.slice(0, 25).join(' | '))
  console.log(`${lang}: extra ${extra.length}`, extra.slice(0, 25).join(' | '))
}

// Also report keys referenced in code that do not exist in en.ts.
const used = new Set()
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) scan(path)
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const text = fs.readFileSync(path, 'utf8')
      for (const match of text.matchAll(/t\(\s*[`'"]([^`'"$]+)[`'"]/g)) used.add(match[1])
      for (const match of text.matchAll(/t\(\s*`([^`$]*)\$\{/g)) used.add(match[1] + '*')
    }
  }
}
scan('src')
const dynamic = [...used].filter((k) => k.endsWith('*'))
const staticKeys = [...used].filter((k) => !k.endsWith('*'))
const missingUsed = staticKeys.filter((k) => !base.has(k))
console.log('static keys used:', staticKeys.length, 'missing:', missingUsed.join(' | '))
console.log('dynamic templates:', dynamic.length)
for (const d of dynamic) {
  console.log('  ', d, '-> exists:', base.has(d.replace('*', '')) || [...base].some((k) => k.startsWith(d.slice(0, -1))))
}
