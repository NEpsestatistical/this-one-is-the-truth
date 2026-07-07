import { createBrowserClient } from './auth'

export function getClientDb() {
  return createBrowserClient()
}
