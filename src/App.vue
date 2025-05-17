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
import UndoLastBlockDelete from './components/UndoLastBlockDelete.vue'
import { useKanbanStore } from './stores/kanban'
import { useTrashStore } from './stores/trash'
// import { setupAutoBackup, backupLocalStorage } from './lib/backup' // Commenting out backupLocalStorage as its only usage is commented out
import { setupAutoBackup } from './lib/backup'
import { ref, onMounted, computed } from 'vue'
import LoginForm from './components/LoginForm.vue'
import { supabase } from './lib/supabase'
import UpdatePasswordForm from './components/UpdatePasswordForm.vue'

const kanbanStore = useKanbanStore()
const trashStore = useTrashStore()
const mainBoardRef = ref(null)
const notificationRef = ref(null)
const session = ref(null)
const showUpdatePasswordForm = ref(false)
const passwordRecoverySignal = ref(false)

const hasDeletedBlocks = computed(() => {
  return trashStore.trashedItems.blocks.length > 0
})

function reloadData() {
  kanbanStore.loadFromSupabase()
  // triggerBackup()
}

/* // Commenting out as per user action and to avoid linter warning
async function triggerBackup() {
  try {
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
*/

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

function checkForRecoveryFlow() {
  if (window.location.hash.includes('type=recovery')) {
    const params = new URLSearchParams(window.location.hash.substring(1))
    if (params.get('type') === 'recovery') {
      console.log('Recovery flow detected in URL hash.')
      return true
    }
  }
  return false
}

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session

    if (passwordRecoverySignal.value) {
      console.log(
        '[ON_MOUNTED] Password recovery signal is active. UpdatePasswordForm should be shown. Skipping reloadData.',
      )
      return
    }

    if (showUpdatePasswordForm.value) {
      console.log(
        '[ON_MOUNTED] UpdatePasswordForm is already shown (e.g. direct hash nav). Skipping further checks here.',
      )
      return
    }

    if (session.value && checkForRecoveryFlow()) {
      console.log('[ON_MOUNTED] Recovery flow detected by getSession and URL hash.')
      showUpdatePasswordForm.value = true
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search,
      )
    } else if (session.value) {
      console.log(
        '[ON_MOUNTED] User session exists, not recovery, and not handled by PW recovery event. Reloading data.',
      )
      reloadData()
    } else {
      console.log('[ON_MOUNTED] No initial session.')
    }
  })

  supabase.auth.onAuthStateChange((event, newSession) => {
    const previousSession = session.value
    session.value = newSession
    console.log('[AUTH_STATE_CHANGE] Event:', event, 'New Session:', newSession)

    if (newSession) {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AUTH_STATE_CHANGE] Event is PASSWORD_RECOVERY. Forcing update password form.')
        showUpdatePasswordForm.value = true
        passwordRecoverySignal.value = true
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        )
      } else {
        if (passwordRecoverySignal.value) {
          console.log(
            '[AUTH_STATE_CHANGE] Password recovery signal is active. Maintaining showUpdatePasswordForm = true.',
          )
        } else {
          const isRecoveryViaHash = checkForRecoveryFlow()
          console.log('[AUTH_STATE_CHANGE] Is Recovery Flow (from URL hash):', isRecoveryViaHash)
          if (isRecoveryViaHash) {
            showUpdatePasswordForm.value = true
            passwordRecoverySignal.value = true
            console.log(
              '[AUTH_STATE_CHANGE] showUpdatePasswordForm set to true for recovery (from URL).',
            )
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search,
            )
          } else {
            showUpdatePasswordForm.value = false
            console.log(
              '[AUTH_STATE_CHANGE] showUpdatePasswordForm set to false (not PASSWORD_RECOVERY event, no recovery hash, no active signal).',
            )
            if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && !previousSession)) {
              reloadData()
            }
          }
        }
      }
    } else {
      console.log('[AUTH_STATE_CHANGE] User session ended. showUpdatePasswordForm set to false.')
      showUpdatePasswordForm.value = false
    }
  })

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
    },
  )
})

async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error.message)
      if (notificationRef.value) {
        notificationRef.value.showNotification(`Logout failed: ${error.message}`, 'error')
      }
    } else {
      console.log('User logged out successfully')
      if (notificationRef.value) {
        notificationRef.value.showNotification('Successfully logged out!', 'success')
      }
    }
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    if (notificationRef.value) {
      notificationRef.value.showNotification(
        `Logout error: ${error.message || 'Unexpected issue'}`,
        'error',
      )
    }
  }
}

function handlePasswordUpdated() {
  showUpdatePasswordForm.value = false
  passwordRecoverySignal.value = false
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
  if (notificationRef.value) {
    notificationRef.value.showNotification('Password successfully updated!', 'success')
  }
  reloadData()
}
</script>

<template>
  <div v-if="showUpdatePasswordForm" class="flex items-center justify-center min-h-screen">
    <UpdatePasswordForm @password-updated="handlePasswordUpdated" />
  </div>

  <div v-else-if="!session" class="flex items-center justify-center min-h-screen">
    <LoginForm />
  </div>

  <div v-else class="flex flex-col min-h-screen">
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
          <UndoLastBlockDelete v-if="hasDeletedBlocks" />
          <TrashButton />
          <SyncStatus
            :error="kanbanStore.error"
            :isLoading="kanbanStore.isLoading"
            :onReload="reloadData"
          />
          <ConnectionIndicator />
          <button @click="handleLogout" class="btn btn-sm btn-outline btn-error">Logout</button>
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
