<script setup>
import { useTrashStore } from '../stores/trash'
import { useKanbanStore } from '../stores/kanban'
import { computed, ref, onMounted } from 'vue'

const trashStore = useTrashStore()
const kanbanStore = useKanbanStore()

const showColumns = ref(true)
const showBlocks = ref(true)

// Computed properties for filtering
const trashedColumns = computed(() => trashStore.trashedItems.columns)
const trashedBlocks = computed(() => trashStore.trashedItems.blocks)
const retentionPeriod = computed(() => trashStore.retentionDays)

// Restore a column
function restoreColumn(columnId) {
  const column = trashStore.restoreColumn(columnId)
  if (column) {
    kanbanStore.restoreColumnFromTrash(column)
  }
}

// Restore a block
function restoreBlock(blockId) {
  const result = trashStore.restoreBlock(blockId)
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

// Delete permanently
function deleteItemPermanently(id, type) {
  trashStore.deleteItemPermanently(id, type)
}

// Clear all trash
function clearAllTrash() {
  if (confirm('Are you sure you want to permanently delete all items in the trash?')) {
    trashStore.clearTrash()
  }
}

// Calculate and format how many days ago an item was deleted
function timeAgo(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()

  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  }
}

// Load trash data and run cleanup when component is mounted
onMounted(async () => {
  await trashStore.loadFromSupabase()
  trashStore.cleanupOldTrashItems()
})
</script>

<template>
  <div class="trash-view">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Trash</h2>
      <div class="flex gap-2">
        <button @click="$emit('close')" class="btn btn-sm btn-ghost">Close</button>
        <button
          @click="clearAllTrash"
          class="btn btn-sm btn-error"
          :disabled="!trashedColumns.length && !trashedBlocks.length"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Trash description -->
    <div class="card bg-base-200 mb-6 p-4 text-sm gap-3">
      <p>
        Items moved to trash are stored for
        <strong>{{ retentionPeriod || 30 }} days</strong> before being automatically deleted. During
        this time, you can restore them to your board or delete them permanently.
      </p>
      <p>
        When restoring a block, it will be placed in its original column if available, or in the
        first column as a fallback.
      </p>
    </div>

    <!-- Empty state -->
    <div v-if="!trashedColumns.length && !trashedBlocks.length" class="text-center py-8">
      <p class="text-base-content/50">No items in trash</p>
    </div>

    <!-- Columns section -->
    <div v-if="trashedColumns.length" class="mb-8">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold cursor-pointer flex items-center" @click="showColumns = !showColumns">
          <span class="mr-2">{{ showColumns ? '▼' : '►' }}</span>
          Columns ({{ trashedColumns.length }})
        </h3>
      </div>

      <div v-if="showColumns">
        <div
          v-for="column in trashedColumns"
          :key="column.id"
          class="card card-compact bg-base-200 mb-2"
        >
          <div class="card-body">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-base">{{ column.title }}</h4>
                <p class="text-xs opacity-70">Deleted {{ timeAgo(column.deletedAt) }}</p>
                <p class="text-xs opacity-70">Contains {{ column.blocks?.length || 0 }} blocks</p>
              </div>
              <div class="flex gap-2">
                <button @click="restoreColumn(column.id)" class="btn btn-sm btn-primary">
                  Restore
                </button>
                <button
                  @click="deleteItemPermanently(column.id, 'column')"
                  class="btn btn-sm btn-error"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Blocks section -->
    <div v-if="trashedBlocks.length">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold cursor-pointer flex items-center" @click="showBlocks = !showBlocks">
          <span class="mr-2">{{ showBlocks ? '▼' : '►' }}</span>
          Blocks ({{ trashedBlocks.length }})
        </h3>
      </div>

      <div v-if="showBlocks">
        <div
          v-for="block in trashedBlocks"
          :key="block.id"
          class="card card-compact bg-base-200 mb-2"
        >
          <div class="card-body">
            <div class="flex justify-between items-start">
              <div class="w-full max-w-sm">
                <p class="whitespace-pre-wrap break-words min-h-8 max-h-24 overflow-y-auto">
                  {{ block.content || '(Empty block)' }}
                </p>
                <p class="text-xs opacity-70 mt-2">
                  Deleted {{ timeAgo(block.deletedAt) }} from column "{{ block.sourceColumnTitle }}"
                </p>
              </div>
              <div class="flex gap-2">
                <button @click="restoreBlock(block.id)" class="btn btn-sm btn-primary">
                  Restore
                </button>
                <button
                  @click="deleteItemPermanently(block.id, 'block')"
                  class="btn btn-sm btn-error"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.trash-view {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}
</style>
