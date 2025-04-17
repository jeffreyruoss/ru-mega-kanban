<script setup>
import MainBoard from './components/MainBoard.vue'
import ConnectionIndicator from './components/ConnectionIndicator.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'
import BackupNotification from './components/BackupNotification.vue'
import { useKanbanStore } from './stores/kanban'
import {
  setupAutoBackup,
  backupLocalStorage,
  shouldCreateBackup,
  getTimeUntilNextBackup,
} from './lib/backup'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const kanbanStore = useKanbanStore()
// Add a ref to access the MainBoard component
const mainBoardRef = ref(null)
// Add a ref to access the notification component
const notificationRef = ref(null)
// Ref for next backup time display
const nextBackupTime = ref(getNextBackupTimeString())
// Timer ref for updating the countdown
let countdownTimer = null

// Load data is already handled in the store initialization
function reloadData() {
  kanbanStore.loadFromSupabase()
  // Also create a backup when data is manually reloaded
  triggerBackup()
}

// Create a backup with notification
function triggerBackup() {
  // Manual backups always work, even if less than an hour since last backup
  backupLocalStorage(
    (fileName) => {
      if (notificationRef.value) {
        notificationRef.value.showNotification(`Backup created: ${fileName}`, 'success')
      }
      // Update the next backup time display
      nextBackupTime.value = getNextBackupTimeString()
    },
    (error) => {
      if (notificationRef.value) {
        notificationRef.value.showNotification(`Backup failed: ${error}`, 'error')
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

// Setup auto backup on load and before unload
onMounted(() => {
  // Setup auto backup
  setupAutoBackup(
    (fileName) => {
      if (notificationRef.value) {
        notificationRef.value.showNotification(`Auto-backup created: ${fileName}`, 'success')
      }
      // Update the next backup time display
      nextBackupTime.value = getNextBackupTimeString()
    },
    (error) => {
      if (notificationRef.value) {
        notificationRef.value.showNotification(`Auto-backup failed: ${error}`, 'error')
      }
    },
    (skipMessage) => {
      console.log(skipMessage)
      // For auto-backups that are skipped, we'll just log to console
      // But we won't show a notification to the user to avoid confusion
    },
  )

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
  <div class="flex flex-col min-h-screen">
    <header class="px-2 pt-2 pb-3">
      <div class="flex justify-between items-center">
        <input
          v-model="kanbanStore.projectName"
          class="uppercase text-xl bg-transparent border-b-2 border-transparent hover:border-base-300 focus:border-primary focus:outline-none px-1 w-full sm:w-auto"
        />
        <div class="flex items-center gap-4">
          <!-- Hidden columns indicator -->
          <div v-if="mainBoardRef?.hiddenColumns?.length" class="flex gap-2 items-center">
            <div
              v-for="columnId in mainBoardRef.hiddenColumns"
              :key="columnId"
              class="flex items-center"
            >
              <button
                class="cursor-pointer text-xs opacity-70 hover:opacity-100 underline flex items-center gap-1"
                @click="mainBoardRef.toggleColumnVisibility(columnId)"
              >
                {{ kanbanStore.columns.find((col) => col.id === columnId)?.title }}
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
                  class="text-gray-400 hover:text-blue-400"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <button
            @click="kanbanStore.addColumn"
            class="opacity-70 hover:opacity-100 text-sm uppercase px-3 py-1 rounded-md text-white border-[1px] border-gray-700 hover:cursor-pointer"
          >
            + Add Column
          </button>
          <div class="group relative">
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
          <div class="flex items-center">
            <span v-if="kanbanStore.error" class="text-error text-xs">Offline mode</span>
            <span v-else class="text-success text-xs">Synced</span>
            <button
              @click="reloadData"
              class="opacity-50 hover:opacity-100 text-sm px-2 py-1 rounded-md text-white"
              title="Reload data from server"
            >
              ↻
            </button>
          </div>
          <KeyboardShortcuts />
          <ConnectionIndicator />
        </div>
      </div>
      <div v-if="kanbanStore.error" class="text-error text-sm mt-2">
        {{ kanbanStore.error }}
      </div>
      <div v-if="kanbanStore.isLoading" class="text-info text-sm mt-2">Loading...</div>
    </header>
    <main class="flex-1 pt-1 px-2">
      <MainBoard ref="mainBoardRef" />
    </main>
    <BackupNotification ref="notificationRef" />
  </div>
</template>
