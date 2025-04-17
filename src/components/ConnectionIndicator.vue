<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'

const isConnected = ref(false)
const isChecking = ref(true)
const retryTimeout = ref(null)

async function checkConnection() {
  isChecking.value = true
  try {
    const { error } = await supabase.from('projects').select('id').limit(1)
    isConnected.value = !error
  } catch {
    isConnected.value = false
  } finally {
    isChecking.value = false
    scheduleNextCheck()
  }
}

function scheduleNextCheck() {
  // Check connection status every 30 seconds
  retryTimeout.value = setTimeout(checkConnection, 30000)
}

onMounted(() => {
  checkConnection()
})

onUnmounted(() => {
  if (retryTimeout.value) {
    clearTimeout(retryTimeout.value)
  }
})
</script>

<template>
  <div class="tooltip tooltip-left" data-tip="Supabase connection status">
    <div class="flex items-center gap-1">
      <span class="text-sm">Supabase</span>
      <span v-if="isChecking" class="loading loading-spinner loading-xs"></span>
      <span
        v-else
        class="w-2 h-2 rounded-full"
        :class="isConnected ? 'bg-success' : 'bg-error'"
      ></span>
    </div>
  </div>
</template>
