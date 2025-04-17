<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { backupLocalStorage, shouldCreateBackup, getTimeUntilNextBackup } from '../lib/backup'

// Props for notification methods
const props = defineProps({
  onBackupCreated: Function,
  onBackupFailed: Function,
})

// Ref for next backup time display
const nextBackupTime = ref(getNextBackupTimeString())
// Timer ref for updating the countdown
let countdownTimer = null

// Create a backup with notification
function triggerBackup() {
  // Manual backups always work, even if less than an hour since last backup
  backupLocalStorage(
    (fileName) => {
      if (props.onBackupCreated) {
        props.onBackupCreated(fileName)
      }
      // Update the next backup time display
      nextBackupTime.value = getNextBackupTimeString()
    },
    (error) => {
      if (props.onBackupFailed) {
        props.onBackupFailed(error)
      }
    },
  )
}

// Get formatted time until next backup
function getNextBackupTimeString() {
  if (shouldCreateBackup()) {
    return 'Ready now'
  }

  const timeUntil = getTimeUntilNextBackup()
  return `${timeUntil.hours}h ${timeUntil.minutes}m ${timeUntil.seconds}s`
}

// Update the countdown timer
function updateCountdown() {
  nextBackupTime.value = getNextBackupTimeString()
}

// Setup timer for countdown
onMounted(() => {
  // Setup countdown refresh timer
  countdownTimer = setInterval(updateCountdown, 1000)
})

// Clean up timer when component is destroyed
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="group relative backup-button">
    <button
      @click="triggerBackup"
      class="opacity-70 hover:opacity-100 text-sm uppercase px-3 py-1 rounded-md text-white border-[1px] border-gray-700 hover:cursor-pointer"
      title="Create and download backup of data"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="inline-block mr-1"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      Backup
    </button>
    <div
      class="absolute top-full mt-2 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
    >
      Next auto-backup: {{ nextBackupTime }}
    </div>
  </div>
</template>
