<script setup>
// Props for the component
defineProps({
  // Error state
  error: {
    type: String,
    default: '',
  },
  // Loading state
  isLoading: {
    type: Boolean,
    default: false,
  },
  // Reload function
  onReload: {
    type: Function,
    required: true,
  },
})
</script>

<template>
  <div class="flex items-center">
    <span v-if="error" class="text-error text-xs">Offline mode</span>
    <span v-else class="text-success text-xs">Synced</span>
    <button
      @click="onReload"
      class="opacity-50 hover:opacity-100 text-sm px-2 py-1 rounded-md text-white"
      title="Reload data from server"
    >
      ↻
    </button>
  </div>
</template>
