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
})
</script>

<template>
  <div v-if="error" class="text-error text-sm mt-2">
    {{ error }}
  </div>
  <div v-if="isLoading" class="text-info text-sm mt-2">Loading...</div>
</template>
