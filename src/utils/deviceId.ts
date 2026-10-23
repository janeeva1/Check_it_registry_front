// A random id kept in this browser, sent as X-Device-Id when signing in, so
// "remember this device" keeps working after the browser updates itself.
// It identifies the browser only; nothing about the person is in it.
const KEY = 'po_device_id'

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY)
    if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID().replace(/-/g, '')
        : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return '' // storage blocked (private mode): the server falls back to browser headers
  }
}

export const deviceHeaders = (): Record<string, string> => {
  const id = getDeviceId()
  return id ? { 'X-Device-Id': id } : {}
}
