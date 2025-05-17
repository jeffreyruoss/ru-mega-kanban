<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 card bg-base-200 shadow-xl p-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-base-content">
          Set your new password
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handlePasswordUpdate">
        <div>
          <label for="new-password" class="sr-only">New Password</label>
          <input
            id="new-password"
            v-model="newPassword"
            name="new-password"
            type="password"
            required
            class="input input-bordered w-full"
            placeholder="Enter new password"
          />
        </div>
        <!-- Optional: Confirm password field -->
        <!--
        <div>
          <label for="confirm-password" class="sr-only">Confirm New Password</label>
          <input id="confirm-password" v-model="confirmPassword" name="confirm-password" type="password" required class="input input-bordered w-full mt-4" placeholder="Confirm new password">
        </div>
        -->

        <div v-if="errorMessage" class="alert alert-error shadow-lg mt-4">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </div>
        <div v-if="successMessage" class="alert alert-success shadow-lg mt-4">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ successMessage }}</span>
          </div>
        </div>

        <div>
          <button type="submit" class="btn btn-primary w-full mt-6" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            Update Password
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase' // Adjusted path

const newPassword = ref('')
// const confirmPassword = ref(''); // Optional for confirm password
const errorMessage = ref(null)
const successMessage = ref(null)
const loading = ref(false)

const emit = defineEmits(['password-updated'])

async function handlePasswordUpdate() {
  errorMessage.value = null
  successMessage.value = null

  // Optional: Add check for newPassword === confirmPassword
  // if (newPassword.value !== confirmPassword.value) {
  //   errorMessage.value = "Passwords do not match.";
  //   return;
  // }
  if (!newPassword.value) {
    errorMessage.value = 'Password cannot be empty.'
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword.value,
    })

    if (error) {
      errorMessage.value = `Error updating password: ${error.message}`
      console.error('Password update error:', error.message)
    } else {
      successMessage.value = 'Password updated successfully! You can now use your new password.'
      console.log('Password update successful:', data)
      // Optionally, clear fields or redirect after a delay
      setTimeout(() => {
        emit('password-updated') // Notify parent component
      }, 2000) // Give user time to read success message
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
    console.error('Unexpected password update error:', error)
  } finally {
    loading.value = false
  }
}
</script>
