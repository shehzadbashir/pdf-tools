const BASE = 'https://shehzadbashir.xyz'
const UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const paths = [
  '/',
  '/merge-pdf',
  '/split-pdf',
  '/compress-pdf',
  '/pdf-to-word',
  '/pdf-to-excel',
  '/pdf-to-jpg',
  '/word-to-pdf',
  '/image-to-pdf',
  '/organize-pdf',
  '/watermark-pdf',
  '/sign-pdf',
  '/protect-pdf',
  '/unlock-pdf',
  '/ocr-pdf',
  '/privacy',
  '/terms',
  '/history',
]

const grab = (html, re) => html.match(re)?.[0]?.replace(/\s+/g, ' ') ?? 'MISSING'
let bad = 0

for (const path of paths) {
  const res = await fetch(BASE + path, { headers: { 'user-agent': UA } })
  const html = await res.text()
  const title = grab(html, /<title>[\s\S]*?<\/title>/)
  const canonical = grab(html, /<link rel="canonical"[^>]*>/)
  const robots = grab(html, /<meta\s+name="robots"[\s\S]*?\/>/)
  const ok = res.status === 200 && title !== 'MISSING' && canonical !== 'MISSING'
  if (!ok) bad++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${path} [${res.status}]`)
  console.log(`       ${title}`)
  console.log(`       ${canonical}`)
  if (path === '/history') console.log(`       ${robots}`)
}
console.log(bad === 0 ? '\nALL ROUTES OK' : `\n${bad} FAILURES`)
process.exit(bad === 0 ? 0 : 1)
