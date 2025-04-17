<script setup>
import { ref } from 'vue'

const notification = ref({
  show: false,
  message: '',
  type: 'info', // info, success, error
})

// Method to show a notification
function showNotification(message, type = 'info', duration = 3000) {
  notification.value = {
    show: true,
    message,
    type,
  }

  // Auto-hide after duration
  setTimeout(() => {
    notification.value.show = false
  }, duration)
}

// Expose the method to parent components
defineExpose({
  showNotification,
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="notification.show"
      class="fixed bottom-4 right-4 p-3 rounded-md shadow-lg max-w-sm z-50"
      :class="{
        'bg-info text-info-content': notification.type === 'info',
        'bg-success text-success-content': notification.type === 'success',
        'bg-error text-error-content': notification.type === 'error',
      }"
    >
      {{ notification.message }}
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
