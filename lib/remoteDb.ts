import { driveService } from './drive'

// Remote-driven single-state DB stored in Drive's appDataFolder
export interface RemoteState {
  transactions: any[]
  categories: any[]
  currencies: any[]
  settings: any | null
  last_modified?: string
}

const FILE_NAME = 'financetracker.db'

async function getFileId() {
  // driveService is client-only; avoid calling it during SSR where `window` is undefined.
  if (typeof window === 'undefined') return null
  return await driveService.findFile(FILE_NAME, 'appDataFolder')
}

export async function readState(): Promise<RemoteState> {
  // If running on the server, return an empty initial state so SSR can proceed
  if (typeof window === 'undefined') {
    return {
      transactions: [],
      categories: [],
      currencies: [],
      settings: null,
      last_modified: new Date().toISOString(),
    }
  }

  const fileId = await getFileId()
  if (!fileId) {
    // create initial empty state
    const initial: RemoteState = {
      transactions: [],
      categories: [],
      currencies: [],
      settings: null,
      last_modified: new Date().toISOString(),
    }
    const newId = await driveService.uploadFile(JSON.stringify(initial, null, 2), FILE_NAME, 'appDataFolder')
    // return initial state
    return initial
  }

  const content = await driveService.downloadFile(fileId)
  try {
    const parsed = JSON.parse(content)
    return parsed as RemoteState
  } catch (e) {
    // corrupted file: return empty state
    return {
      transactions: [],
      categories: [],
      currencies: [],
      settings: null,
      last_modified: new Date().toISOString(),
    }
  }
}

export async function writeState(state: RemoteState) {
  const fileId = await getFileId()
  const payload = { ...state, last_modified: new Date().toISOString() }
  const body = JSON.stringify(payload, null, 2)
  if (fileId) {
    await driveService.updateFile(fileId, body)
  } else {
    await driveService.uploadFile(body, FILE_NAME, 'appDataFolder')
  }
}

// Export a timestamped file into a visible Drive folder `FinanceTracker`
export async function exportSnapshotVisibleFolder(): Promise<string> {
  // Create/find visible folder named FinanceTracker at Drive root
  let folderId = await driveService.findFolder('FinanceTracker')
  if (!folderId) {
    folderId = await driveService.createFolder('FinanceTracker')
  }

  // Read current live state and write a timestamped copy
  const state = await readState()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `financetracker_${timestamp}.db`
  const fileId = await driveService.uploadFile(JSON.stringify(state, null, 2), fileName, folderId)
  return fileId
}

// Helper to generate numeric ids for arrays
export function nextId(arr: Array<{ id?: number }>) {
  const max = arr.reduce((m, it) => Math.max(m, (it.id as number) || 0), 0)
  return max + 1
}

export const remoteDb = {
  readState,
  writeState,
  exportSnapshotVisibleFolder,
  nextId,
}
