<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 card bg-base-200 shadow-xl p-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-base-content">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="-space-y-px rounded-md shadow-sm">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="input input-bordered w-full mb-4"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="input input-bordered w-full"
              placeholder="Password"
            />
          </div>
        </div>

        <div v-if="errorMessage" class="alert alert-error shadow-lg">
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
        <div v-if="successMessage" class="alert alert-success shadow-lg">
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
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            Sign in
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// Make sure this path is correct for your project structure
import { supabase } from '../lib/supabase' // Adjust path if needed

const email = ref('')
const password = ref('')
const errorMessage = ref(null)
const successMessage = ref(null)
const loading = ref(false)

async function handleLogin() {
  errorMessage.value = null
  successMessage.value = null
  loading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      errorMessage.value = error.message
      console.error('Login error:', error.message)
    } else {
      successMessage.value = 'Successfully logged in! Redirecting...'
      console.log('Login successful:', data)
      // You'll typically rely on onAuthStateChange in App.vue or your auth store
      // to handle redirects or global state changes after successful login.
      // For example, router.push('/dashboard') or store.setUser(data.user)
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
    console.error('Unexpected login error:', error)
  } finally {
    loading.value = false
  }
}
</script>
