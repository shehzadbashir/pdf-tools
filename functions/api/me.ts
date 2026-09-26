import { getSession, json, type PagesHandler } from '../../server/shared'

export const onRequestGet: PagesHandler = async ({ request, env }) => {
  const user = await getSession(request, env)
  return json({ user })
}
