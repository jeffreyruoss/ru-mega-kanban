<script setup>
import { ref, computed } from 'vue'
import { useTrashStore } from '../stores/trash'
import TrashView from './TrashView.vue'

const trashStore = useTrashStore()
const showTrashModal = ref(false)

const hasTrash = computed(() => {
  return trashStore.trashedItems.columns.length > 0 || trashStore.trashedItems.blocks.length > 0
})

function toggleTrashModal() {
  showTrashModal.value = !showTrashModal.value
}

// Load trash data from Supabase
trashStore.loadFromSupabase()
</script>

<template>
  <div>
    <button
      @click="toggleTrashModal"
      class="btn btn-sm btn-ghost flex items-center gap-1"
      :class="{ 'btn-error': hasTrash }"
      title="Trash"
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
      >
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      </svg>
      <span v-if="hasTrash" class="badge badge-xs badge-error"></span>
    </button>

    <!-- Trash Modal -->
    <div class="modal" :class="{ 'modal-open': showTrashModal }">
      <div class="modal-box max-w-4xl">
        <TrashView @close="toggleTrashModal" />
      </div>
      <div class="modal-backdrop" @click="toggleTrashModal"></div>
    </div>
  </div>
</template>
