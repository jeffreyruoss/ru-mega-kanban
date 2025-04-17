<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const connectionStatus = ref('Checking connection...')
const projectData = ref(null)
const error = ref(null)

async function testConnection() {
  try {
    connectionStatus.value = 'Testing connection...'

    // Try to get data from the projects table
    const { data, error: queryError } = await supabase.from('projects').select('*')

    if (queryError) throw queryError

    projectData.value = data
    connectionStatus.value = 'Connected successfully!'
  } catch (err) {
    console.error('Connection error:', err)
    error.value = err.message || 'Failed to connect to Supabase'
    connectionStatus.value = 'Connection failed'
  }
}

onMounted(() => {
  testConnection()
})
</script>

<template>
  <div class="p-4 bg-base-200 rounded-box">
    <h3 class="text-lg font-medium mb-2">Supabase Connection Test</h3>

    <div
      :class="`mb-2 ${connectionStatus === 'Connected successfully!' ? 'text-success' : connectionStatus === 'Connection failed' ? 'text-error' : 'text-info'}`"
    >
      Status: {{ connectionStatus }}
    </div>

    <div v-if="error" class="text-error mb-2">Error: {{ error }}</div>

    <div v-if="projectData && projectData.length > 0" class="mt-4">
      <h4 class="font-medium">Project Data:</h4>
      <pre class="bg-base-300 p-2 rounded-box mt-2 text-sm overflow-auto">{{
        JSON.stringify(projectData, null, 2)
      }}</pre>
    </div>

    <div v-else-if="connectionStatus === 'Connected successfully!'" class="mt-4">
      <p>Connected, but no project data found.</p>
      <p class="text-sm mt-2">Make sure you've run the SQL setup script in Supabase.</p>
    </div>

    <button @click="testConnection" class="btn btn-sm btn-primary mt-4">
      Test Connection Again
    </button>
  </div>
</template>
