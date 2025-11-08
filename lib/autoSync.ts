import { syncService } from './sync'
import { isSignedIn } from './googleDrive'

let timer: ReturnType<typeof setTimeout> | null = null

export function startAutoSync() {
  if (typeof window === 'undefined') return () => {}

  const handler = () => {
    // Debounce multiple quick changes into a single backup
    if (timer) clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        const signed = await isSignedIn()
        if (signed) {
          await syncService.backupToDrive()
        }
      } catch (err) {
        console.warn('autoSync backup failed', err)
      }
    }, 800)
  }

  window.addEventListener('finance:data:changed', handler)

  return () => {
    if (timer) clearTimeout(timer)
    window.removeEventListener('finance:data:changed', handler)
  }
}
