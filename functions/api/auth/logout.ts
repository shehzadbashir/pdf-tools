import { clearedCookie, json, type PagesHandler } from '../../../server/shared'

export const onRequestPost: PagesHandler = () => {
  return json({ ok: true }, { headers: { 'set-cookie': clearedCookie() } })
}
