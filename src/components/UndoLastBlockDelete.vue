<script setup>
import { useTrashStore } from '../stores/trash'
import { useKanbanStore } from '../stores/kanban'
import { computed } from 'vue'

const trashStore = useTrashStore()
const kanbanStore = useKanbanStore()

// Check if there are any blocks in the trash
const hasTrash = computed(() => {
  return trashStore.trashedItems.blocks.length > 0
})

// Get the most recently deleted block (the first one in the array)
const lastDeletedBlock = computed(() => {
  return trashStore.trashedItems.blocks[0] || null
})

// Function to restore the last deleted block
function undoLastBlockDeletion() {
  if (!lastDeletedBlock.value) return

  const result = trashStore.restoreBlock(lastDeletedBlock.value.id)
  if (result && result.block) {
    // Try to find the original column
    const sourceColumnId = result.sourceColumnId

    // Check if the original column still exists
    const originalColumnExists = kanbanStore.columns.some((col) => col.id === sourceColumnId)

    // If no columns exist at all, create one
    if (kanbanStore.columns.length === 0) {
      kanbanStore.addColumn()
      kanbanStore.restoreBlockToColumn(result.block, kanbanStore.columns[0].id)
    }
    // If original column exists, restore to it
    else if (originalColumnExists) {
      kanbanStore.restoreBlockToColumn(result.block, sourceColumnId)
    }
    // Otherwise restore to first column as fallback
    else {
      kanbanStore.restoreBlockToColumn(result.block, kanbanStore.columns[0].id)
    }
  }
}
</script>

<template>
  <div>
    <button
      @click="undoLastBlockDeletion"
      class="btn btn-sm btn-ghost flex items-center gap-1 border-[1px] border-gray-700 opacity-70"
      :class="{ 'btn-disabled': !hasTrash, 'btn-primary': hasTrash }"
      title="Undo Last Block Deletion"
      :disabled="!hasTrash"
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
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
      </svg>
      <span class="text-sm text-white">Undo Last Block Delete</span>
    </button>
  </div>
</template>
