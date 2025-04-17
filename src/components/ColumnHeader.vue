<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  columnIndex: {
    type: Number,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:title', 'drag-start', 'delete-column', 'toggle-visibility'])

function handleDragStart(event) {
  // Set data for the drag operation
  event.dataTransfer.setData('text/plain', JSON.stringify({ columnIndex: props.columnIndex }))
  event.dataTransfer.effectAllowed = 'move'

  // Emit event for parent component to handle
  emit('drag-start', event)
}

function handleDelete() {
  // Show confirmation dialog before deleting the column
  const confirmMessage = `Are you sure you want to delete the column "${props.title}"?`
  if (confirm(confirmMessage)) {
    emit('delete-column')
  }
}

function handleToggleVisibility() {
  emit('toggle-visibility')
}
</script>

<template>
  <div class="column-header">
    <div class="flex gap-2">
      <div
        class="drag-handle cursor-grab active:cursor-grabbing opacity-50 border-[1px] border-gray-700 rounded w-6 h-6 p-1"
        draggable="true"
        @dragstart="handleDragStart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
          <title>cursor-move</title>
          <path
            d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"
          />
        </svg>
      </div>

      <!-- Eye icon for toggling visibility -->
      <button
        @click="handleToggleVisibility"
        class="w-6 h-6 flex justify-center items-center py-0 opacity-50 hover:opacity-100 border-[1px] border-gray-700 rounded hover:cursor-pointer"
        :title="isHidden ? 'Show column' : 'Hide column'"
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
          class="text-gray-400 hover:text-blue-400"
        >
          <path v-if="!isHidden" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle v-if="!isHidden" cx="12" cy="12" r="3"></circle>
          <path
            v-if="isHidden"
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          ></path>
          <line v-if="isHidden" x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      </button>

      <!-- Trash icon for deleting column -->
      <button
        @click="handleDelete"
        class="w-6 h-6 flex justify-center items-center py-0 opacity-50 hover:opacity-100 border-[1px] border-gray-700 rounded hover:cursor-pointer"
        title="Delete column"
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
          class="text-gray-400 hover:text-red-400"
        >
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>
    </div>

    <div class="border-b-2 border-base-300">
      <input
        type="text"
        :value="title"
        @input="(e) => emit('update:title', e.target.value)"
        placeholder="Enter column title..."
        class="w-full text-2xl border-none p-1 focus:outline-none focus:border-b-2 focus:border-primary focus:mb-[-2px]"
      />
    </div>
  </div>
</template>
