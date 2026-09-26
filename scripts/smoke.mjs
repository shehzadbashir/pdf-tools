/**
 * Headless smoke test: loads a URL in real Chrome, reports JS errors and
 * verifies the React tree actually mounted.
 *
 *   node scripts/smoke.mjs https://shehzadbashir.xyz/ https://shehzadbashir.xyz/merge-pdf
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const CHROME =
  process.env.CHROME_PATH ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync)

const urls = process.argv.slice(2)

/** Google's GIS iframe emits report-only CSP noise; it is not our bug. */
const isThirdPartyNoise = (text) =>
  /report-only Content Security Policy/i.test(text) || /csp\.withgoogle\.com/i.test(text)
if (!CHROME) {
  console.error('No Chrome/Edge found')
  process.exit(1)
}
if (urls.length === 0) urls.push('http://localhost:4173/')

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})

let failures = 0

for (const url of urls) {
  const page = await browser.newPage()
  const problems = []
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !isThirdPartyNoise(message.text())) {
      problems.push(`console: ${message.text()}`)
    }
  })
  page.on('requestfailed', (request) => {
    if (!isThirdPartyNoise(request.url())) {
      problems.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`)
    }
  })

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const state = await page.evaluate(() => {
      const root = document.getElementById('root')
      const header = document.querySelector('header')
      const h1 = document.querySelector('h1')
      return {
        rootChildren: root ? root.childElementCount : -1,
        header: Boolean(header),
        heading: h1 ? h1.textContent?.trim().slice(0, 80) : null,
        text: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      }
    })

    const ok = state.rootChildren > 0 && state.header && problems.length === 0
    if (!ok) failures++
    console.log(`${ok ? 'PASS' : 'FAIL'} ${url}`)
    console.log(`  rootChildren=${state.rootChildren} header=${state.header} h1=${state.heading}`)
    if (state.text) console.log(`  text: ${state.text}`)
    for (const problem of problems) console.log(`  ! ${problem}`)
  } catch (error) {
    failures++
    console.log(`FAIL ${url} -> ${error.message}`)
  }

  await page.close()
}

await browser.close()
process.exit(failures === 0 ? 0 : 1)
