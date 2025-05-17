/**
 * Utility functions for backing up localStorage data
 */

const STORAGE_KEY = 'ru-mega-kanban-data'
const PROJECT_NAME_KEY = 'ru-mega-kanban-project-name'
const LAST_BACKUP_KEY = 'ru-mega-kanban-last-backup'
const MIN_BACKUP_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Creates and downloads a backup of localStorage data
 * @param {Function} onSuccess - Optional callback when backup is successful
 * @param {Function} onError - Optional callback when backup fails
 * @returns {Promise<string|null>} The filename of the created backup or null if failed
 */
export async function backupLocalStorage(onSuccess, onError) {
  try {
    // Get data from localStorage
    const data = localStorage.getItem(STORAGE_KEY)
    const projectName = localStorage.getItem(PROJECT_NAME_KEY)

    if (!data) {
      const msg = 'No data found in localStorage to backup'
      console.warn(msg)
      if (onError) onError(msg)
      return null
    }

    // Create backup object with metadata
    const backup = {
      timestamp: new Date().toISOString(),
      projectName: projectName || 'Mega Kanban',
      data: JSON.parse(data),
    }

    // Convert to JSON string
    const backupJson = JSON.stringify(backup, null, 2)

    // Format date for filename
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0]
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-')
    const fileName = `mega-kanban-backup-${dateStr}-${timeStr}.json`

    // Fallback to normal download (now the only method)
    // Create download
    const blob = new Blob([backupJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create link and trigger download
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)

    // Save backup timestamp
    localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString())

    console.log(`Backup created: ${fileName}`)

    if (onSuccess) onSuccess(fileName)
    return fileName
  } catch (error) {
    console.error('Error creating backup:', error)
    if (onError) onError(error.message)
    return null
  }
}

/**
 * Checks if enough time has passed since the last backup
 * @returns {boolean} True if it's time for a new backup
 */
export function shouldCreateBackup() {
  const lastBackup = localStorage.getItem(LAST_BACKUP_KEY)
  if (!lastBackup) return true

  const now = Date.now()
  const timeSinceLastBackup = now - parseInt(lastBackup, 10)
  return timeSinceLastBackup >= MIN_BACKUP_INTERVAL
}

/**
 * Gets the time until next backup is allowed
 * @returns {Object} Object with hours, minutes and seconds until next backup
 */
export function getTimeUntilNextBackup() {
  const lastBackup = localStorage.getItem(LAST_BACKUP_KEY)
  if (!lastBackup) return { hours: 0, minutes: 0, seconds: 0 }

  const now = Date.now()
  const lastBackupTime = parseInt(lastBackup, 10)
  const nextBackupTime = lastBackupTime + MIN_BACKUP_INTERVAL

  const timeRemaining = Math.max(0, nextBackupTime - now)

  const hours = Math.floor(timeRemaining / (60 * 60 * 1000))
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000)

  return { hours, minutes, seconds }
}

/**
 * Attempts to create an automatic backup if the time interval allows
 * @param {Function} onSuccess - Optional callback when backup is successful
 * @param {Function} onError - Optional callback when backup fails
 * @param {Function} onSkipped - Optional callback when backup is skipped
 */
export async function attemptAutoBackup(onSuccess, onError, onSkipped) {
  if (shouldCreateBackup()) {
    console.log('Attempting auto-backup...')
    await backupLocalStorage(onSuccess, onError)
  } else {
    const timeUntilNext = getTimeUntilNextBackup()
    const skipMessage = `Auto-backup skipped. Next backup in ${timeUntilNext.hours}h ${timeUntilNext.minutes}m`
    console.log(skipMessage)
    if (onSkipped) onSkipped(skipMessage, timeUntilNext)
    return null
  }
}

/**
 * Registers event listeners to trigger backups
 * @param {Function} onSuccess - Optional callback when backup is successful
 * @param {Function} onError - Optional callback when backup fails
 * @param {Function} onSkipped - Optional callback when backup is skipped
 */
export function setupAutoBackup(onSuccess, onError, onSkipped) {
  // Helper to pass callbacks
  const autoBackup = () => {
    attemptAutoBackup(onSuccess, onError, onSkipped).catch((error) => {
      console.error('Auto-backup error:', error)
      if (onError) onError(error.message || 'Unknown error during auto-backup')
    })
  }

  // Create backup on page refresh/load
  window.addEventListener('load', autoBackup)

  // Also backup when PWA is being closed/refreshed
  window.addEventListener('beforeunload', autoBackup)
}
