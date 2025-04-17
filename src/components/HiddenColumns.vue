<script setup>
// Props for the component
defineProps({
  // Hidden columns array
  hiddenColumns: {
    type: Array,
    default: () => [],
  },
  // Function to toggle visibility
  toggleVisibility: {
    type: Function,
    required: true,
  },
  // Columns data to display titles
  columns: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div v-if="hiddenColumns?.length" class="flex gap-2 items-center hidden-columns">
    <div v-for="columnId in hiddenColumns" :key="columnId" class="flex items-center">
      <button
        class="cursor-pointer text-xs opacity-70 hover:opacity-100 underline flex items-center gap-1"
        @click="toggleVisibility(columnId)"
      >
        {{ columns.find((col) => col.id === columnId)?.title }}
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
</template>
