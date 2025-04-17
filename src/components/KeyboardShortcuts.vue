<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMac = ref(false)
const isModalOpen = ref(false)

onMounted(() => {
  // Detect if user is on Mac
  isMac.value = navigator.platform.toLowerCase().includes('mac')

  // Add keyboard shortcut listener
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Remove event listener when component is unmounted
  window.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(event) {
  // Check for Cmd+? on Mac or Ctrl+? on Windows/Linux
  if ((isMac.value ? event.metaKey : event.ctrlKey) && event.key === '/') {
    event.preventDefault()
    openModal()
  }
  // else if esc is pressed, close the modal
  else if (event.key === 'Escape') {
    closeModal()
  }
}

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}
</script>

<template>
  <div>
    <!-- Button to open modal -->
    <button
      @click="openModal"
      class="btn btn-sm opacity-70 bg-transparent border-[1px] border-gray-700 hover:opacity-100 text-sm"
      title="Keyboard shortcuts"
    >
      Keyboard shortcuts <span class="opacity-75 text-xs">{{ isMac ? '⌘' : 'Ctrl' }}+/</span>
    </button>

    <!-- Modal dialog -->
    <dialog :open="isModalOpen" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-2xl pb-4">Keyboard Shortcuts</h3>

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <kbd class="kbd kbd-xl">{{ isMac ? '⌘' : 'Ctrl' }}</kbd>
              <span>+</span>
              <kbd class="kbd kbd-xl">Enter</kbd>
            </div>
            <span class="ml-2">New block</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <kbd class="kbd kbd-xl">{{ isMac ? '⌘' : 'Ctrl' }}</kbd>
              <span>+</span>
              <kbd class="kbd kbd-xl">{{ isMac ? '⌫' : 'Del' }}</kbd>
            </div>
            <span class="ml-2">Delete block</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <kbd class="kbd kbd-xl">{{ isMac ? '⌘' : 'Ctrl' }}</kbd>
              <span>+</span>
              <kbd class="kbd kbd-xl">i</kbd>
            </div>
            <span class="ml-2">Toggle important text (warning color text)</span>
          </div>
        </div>

        <div class="modal-action">
          <button @click="closeModal" class="btn">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button>Close</button>
      </form>
    </dialog>
  </div>
</template>
