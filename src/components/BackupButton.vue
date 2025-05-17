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
// Modal state
const isModalOpen = ref(false)

// Create a backup with notification
async function triggerBackup() {
  // Manual backups always work, even if less than an hour since last backup
  try {
    await backupLocalStorage(
      (fileName) => {
        if (props.onBackupCreated) {
          props.onBackupCreated(fileName)
        }
        // Update the next backup time display
        nextBackupTime.value = getNextBackupTimeString()
        // Close the modal after successful backup
        closeModal()
      },
      (error) => {
        if (props.onBackupFailed) {
          props.onBackupFailed(error)
        }
      },
    )
  } catch (error) {
    console.error('Backup error:', error)
    if (props.onBackupFailed) {
      props.onBackupFailed(error.message || 'Unknown error during backup')
    }
  }
}

// Open modal
function openModal() {
  isModalOpen.value = true
}

// Close modal
function closeModal() {
  isModalOpen.value = false
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
  <div class="backup-button">
    <!-- Button to open modal -->
    <button
      @click="openModal"
      class="opacity-70 hover:opacity-100 text-sm px-3 py-1 rounded-md text-white border-[1px] border-gray-700 hover:cursor-pointer"
      title="Manage backups"
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

    <!-- Modal dialog -->
    <dialog :open="isModalOpen" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-2xl pb-4">Backup Manager</h3>

        <div class="flex flex-col gap-4">
          <div class="p-4 rounded-lg border-[1px] border-gray-700">
            <h4 class="font-semibold text-lg mb-2">About Backups</h4>
            <p class="mb-3">
              Backups allow you to save your Kanban board data to your local device. Your data is
              automatically backed up hourly while you use the application.
            </p>
            <p>Backups are saved as JSON files that can be imported later if needed.</p>
            <p class="mt-2">
              All backups will be downloaded to your browser's default downloads folder.
            </p>
          </div>

          <div
            class="p-4 rounded-lg flex items-center justify-between border-[1px] border-gray-700"
          >
            <div>
              <h4 class="font-semibold text-lg">Next Auto-Backup</h4>
              <p class="text-primary">{{ nextBackupTime }}</p>
            </div>
            <button @click="triggerBackup" class="btn">Create and Download Backup</button>
          </div>
        </div>

        <div class="modal-action pt-4">
          <button @click="closeModal" class="btn">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button>Close</button>
      </form>
    </dialog>
  </div>
</template>
