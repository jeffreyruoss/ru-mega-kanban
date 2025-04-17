<script setup>
import { ref, nextTick, defineExpose } from 'vue'
import KanbanBlock from './KanbanBlock.vue'
import HeaderColumn from './ColumnHeader.vue'
import { useKanbanStore } from '../stores/kanban'

const kanbanStore = useKanbanStore()
const blockRefs = ref({})
const dragOverColumnIndex = ref(null)
const dragOverBlockId = ref(null)
const dragOverPosition = ref(null) // 'before', 'after', or null
const hiddenColumns = ref([]) // Track hidden columns by ID

function addBlockAfter(column, blockId) {
  const newBlock = kanbanStore.addBlockAfter(column.id, blockId)
  if (newBlock) {
    // Focus on the new block after the DOM updates
    nextTick(() => {
      const refKey = `${column.id}-${newBlock.id}`
      if (blockRefs.value[refKey]) {
        blockRefs.value[refKey].focus()
      }
    })
  }
}

function setBlockRef(columnId, blockId, el) {
  const refKey = `${columnId}-${blockId}`
  if (el) {
    blockRefs.value[refKey] = el
  } else {
    delete blockRefs.value[refKey]
  }
}

function handleDragOver(event, index) {
  event.preventDefault()
  dragOverColumnIndex.value = index
}

function handleDragLeave() {
  dragOverColumnIndex.value = null
}

function handleDrop(event, targetIndex) {
  event.preventDefault()
  dragOverColumnIndex.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))

    if (data.columnIndex !== undefined) {
      // Column drop
      const sourceIndex = data.columnIndex
      kanbanStore.reorderColumns(sourceIndex, targetIndex)
    }
  } catch (err) {
    console.error('Error during drop operation:', err)
  }
}

function handleBlockDragOver(event, columnId, blockId, position) {
  event.preventDefault()
  event.stopPropagation()

  dragOverBlockId.value = blockId
  dragOverPosition.value = position
}

function handleBlockDragLeave(event) {
  event.preventDefault()

  // Only clear if we're not entering another valid target
  if (!event.relatedTarget?.closest('.block-drop-zone')) {
    dragOverBlockId.value = null
    dragOverPosition.value = null
  }
}

function handleBlockDrop(event, targetColumnId, targetBlockIndex) {
  event.preventDefault()
  event.stopPropagation()

  // Reset drag states
  dragOverBlockId.value = null
  dragOverPosition.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))

    if (data.columnId !== undefined && data.blockIndex !== undefined) {
      const sourceColumnId = data.columnId
      const sourceBlockIndex = data.blockIndex

      kanbanStore.reorderBlocks(sourceColumnId, sourceBlockIndex, targetColumnId, targetBlockIndex)
    }
  } catch (err) {
    console.error('Error during block drop operation:', err)
  }
}

// Add these functions to handle navigation between blocks
function handleNavigateUp(columnId, blockIndex) {
  if (blockIndex > 0) {
    // Navigate to previous block in the same column
    const prevBlockId = kanbanStore.columns.find((col) => col.id === columnId).blocks[
      blockIndex - 1
    ].id
    const refKey = `${columnId}-${prevBlockId}`

    if (blockRefs.value[refKey]) {
      const textarea = blockRefs.value[refKey].$el.querySelector('textarea')
      if (textarea) {
        textarea.focus()

        // Set cursor position to the end of the content
        const length = textarea.value.length
        textarea.setSelectionRange(length, length)
      }
    }
  }
}

function handleNavigateDown(columnId, blockIndex) {
  const column = kanbanStore.columns.find((col) => col.id === columnId)

  if (blockIndex < column.blocks.length - 1) {
    // Navigate to next block in the same column
    const nextBlockId = column.blocks[blockIndex + 1].id
    const refKey = `${columnId}-${nextBlockId}`

    if (blockRefs.value[refKey]) {
      const textarea = blockRefs.value[refKey].$el.querySelector('textarea')
      if (textarea) {
        textarea.focus()

        // Set cursor position to the beginning of the content
        textarea.setSelectionRange(0, 0)
      }
    }
  }
}

// Add a function to toggle column visibility
function toggleColumnVisibility(columnId) {
  const index = hiddenColumns.value.indexOf(columnId)
  if (index === -1) {
    // Hide the column
    hiddenColumns.value.push(columnId)
  } else {
    // Show the column
    hiddenColumns.value.splice(index, 1)
  }
}

// After all functions in the script section, expose the hiddenColumns and toggleColumnVisibility
defineExpose({
  hiddenColumns,
  toggleColumnVisibility,
})
</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <div class="flex gap-4 overflow-x-auto pb-4">
      <div
        v-for="(column, index) in kanbanStore.columns"
        :key="column.id"
        class="flex-grow relative"
        :class="{
          'border-l-4 border-primary': dragOverColumnIndex === index,
          hidden: hiddenColumns.includes(column.id),
        }"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
      >
        <HeaderColumn
          :title="column.title"
          :column-index="index"
          :is-hidden="hiddenColumns.includes(column.id)"
          @update:title="(newTitle) => kanbanStore.updateColumnTitle(column.id, newTitle)"
          @delete-column="kanbanStore.deleteColumn(column.id)"
          @toggle-visibility="toggleColumnVisibility(column.id)"
        />

        <div class="flex flex-col">
          <div
            v-for="(block, blockIndex) in column.blocks"
            :key="block.id"
            class="block-wrapper relative"
          >
            <!-- Drop zone before block -->
            <div
              class="block-drop-zone before w-full h-2 -mt-1 mb-1"
              :class="{ active: dragOverBlockId === block.id && dragOverPosition === 'before' }"
              @dragover="handleBlockDragOver($event, column.id, block.id, 'before')"
              @dragleave="handleBlockDragLeave"
              @drop="handleBlockDrop($event, column.id, blockIndex)"
            ></div>

            <KanbanBlock
              :block="block"
              :is-last="blockIndex === column.blocks.length - 1"
              :column-id="column.id"
              :block-index="blockIndex"
              @update:content="
                (newContent) => kanbanStore.updateBlockContent(column.id, block.id, newContent)
              "
              @update:style="(style) => kanbanStore.updateBlockStyle(column.id, block.id, style)"
              @add-block-after="addBlockAfter(column, block.id)"
              @delete-block="kanbanStore.deleteBlock(column.id, block.id)"
              @navigate-up="(data) => handleNavigateUp(data.columnId, data.blockIndex)"
              @navigate-down="(data) => handleNavigateDown(data.columnId, data.blockIndex)"
              :ref="(el) => setBlockRef(column.id, block.id, el)"
            />

            <!-- Drop zone after the last block -->
            <div
              v-if="blockIndex === column.blocks.length - 1"
              class="block-drop-zone after w-full h-2 mt-1"
              :class="{ active: dragOverBlockId === block.id && dragOverPosition === 'after' }"
              @dragover="handleBlockDragOver($event, column.id, block.id, 'after')"
              @dragleave="handleBlockDragLeave"
              @drop="handleBlockDrop($event, column.id, blockIndex + 1)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.block-drop-zone {
  transition:
    height 0.2s,
    background-color 0.2s;
}
.block-drop-zone.active {
  height: 8px;
  background-color: rgba(147, 51, 234, 0.5); /* Purple with transparency */
}
</style>
