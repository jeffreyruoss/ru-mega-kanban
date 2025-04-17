<script setup>
import MainBoard from './components/MainBoard.vue'
import ConnectionIndicator from './components/ConnectionIndicator.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'
import BackupNotification from './components/BackupNotification.vue'
import AddColumnButton from './components/AddColumnButton.vue'
import BackupButton from './components/BackupButton.vue'
import HiddenColumns from './components/HiddenColumns.vue'
import SyncStatus from './components/SyncStatus.vue'
import StatusMessages from './components/StatusMessages.vue'
import TrashButton from './components/TrashButton.vue'
import { useKanbanStore } from './stores/kanban'
import { setupAutoBackup, backupLocalStorage } from './lib/backup'
import { ref, onMounted } from 'vue'

const kanbanStore = useKanbanStore()
// Add a ref to access the MainBoard component
const mainBoardRef = ref(null)
// Add a ref to access the notification component
const notificationRef = ref(null)

// Load data is already handled in the store initialization
function reloadData() {
  kanbanStore.loadFromSupabase()
  // Also create a backup when data is manually reloaded
  triggerBackup()
}

// Create a backup with notification
async function triggerBackup() {
  // Manual backups always work, even if less than an hour since last backup
  try {
    // We'll use callbacks for immediate response
    // and also await the promise for handling errors
    await backupLocalStorage(
      (fileName) => {
        if (notificationRef.value) {
          notificationRef.value.showNotification(`Backup created: ${fileName}`, 'success')
        }
      },
      (error) => {
        if (notificationRef.value) {
          notificationRef.value.showNotification(`Backup failed: ${error}`, 'error')
        }
      },
    )
  } catch (error) {
    if (notificationRef.value) {
      notificationRef.value.showNotification(`Backup failed: ${error}`, 'error')
    }
  }
}

// Handle backup notifications
function handleBackupCreated(fileName) {
  if (notificationRef.value) {
    notificationRef.value.showNotification(`Backup created: ${fileName}`, 'success')
  }
}

function handleBackupFailed(error) {
  if (notificationRef.value) {
    notificationRef.value.showNotification(`Backup failed: ${error}`, 'error')
  }
}

// Setup auto backup on load and before unload
onMounted(() => {
  // Setup auto backup
  setupAutoBackup(
    (fileName) => {
      if (notificationRef.value) {
        notificationRef.value.showNotification(`Auto-backup created: ${fileName}`, 'success')
      }
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
          <HiddenColumns
            :hiddenColumns="mainBoardRef?.hiddenColumns"
            :columns="kanbanStore.columns"
            :toggleVisibility="mainBoardRef?.toggleColumnVisibility"
          />
          <AddColumnButton />
          <KeyboardShortcuts />
          <BackupButton
            :onBackupCreated="handleBackupCreated"
            :onBackupFailed="handleBackupFailed"
          />
          <TrashButton />
          <SyncStatus
            :error="kanbanStore.error"
            :isLoading="kanbanStore.isLoading"
            :onReload="reloadData"
          />
          <ConnectionIndicator />
        </div>
      </div>
      <StatusMessages :error="kanbanStore.error" :isLoading="kanbanStore.isLoading" />
    </header>
    <main class="flex-1 pt-1 px-2">
      <MainBoard ref="mainBoardRef" />
    </main>
    <BackupNotification ref="notificationRef" />
  </div>
</template>
