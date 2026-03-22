<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'

// Build-time injected constants (see docs/.vuepress/config.ts)
declare const __AUTH_ORIGIN__: string
declare const __AUTH_PATH__: string

const state = reactive({
  loading: true,
  authenticating: false,
  isAuthenticated: false,
  error: '' as string,
  profile: null as Record<string, unknown> | null,
})

const form = reactive({
  email: '',
  password: '',
})

const tokenKey = 'filmia.jwt'
const authOrigin = __AUTH_ORIGIN__
const authPath = __AUTH_PATH__

const meUrl = computed(() => `${authOrigin}${authPath}/me`)
const loginUrl = computed(() => `${authOrigin}${authPath}/login`)

const hasError = computed(() => Boolean(state.error))
const isClient = typeof window !== 'undefined'

async function fetchProfile(token: string) {
  try {
    const res = await fetch(meUrl.value, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })

    if (!res.ok) throw new Error('Token expiré ou invalide')

    state.profile = await res.json()
    state.isAuthenticated = true
    state.error = ''
  } catch (err) {
    state.profile = null
    state.isAuthenticated = false
    state.error = (err as Error).message
    if (isClient) localStorage.removeItem(tokenKey)
  } finally {
    state.loading = false
  }
}

async function checkExistingSession() {
  if (!isClient) return
  const token = localStorage.getItem(tokenKey)
  if (!token) {
    state.loading = false
    return
  }
  await fetchProfile(token)
}

async function handleLogin() {
  state.authenticating = true
  state.error = ''
  try {
    const res = await fetch(loginUrl.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: form.email, password: form.password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'Impossible de se connecter')
    }

    const payload = await res.json()
    const accessToken = payload.access_token || payload.token
    if (!accessToken) throw new Error('Le token JWT est manquant dans la réponse')

    if (isClient) localStorage.setItem(tokenKey, accessToken)
    await fetchProfile(accessToken)
  } catch (err) {
    state.error = (err as Error).message
    state.isAuthenticated = false
    state.profile = null
  } finally {
    state.authenticating = false
    state.loading = false
  }
}

function logout() {
  if (isClient) localStorage.removeItem(tokenKey)
  state.isAuthenticated = false
  state.profile = null
}

onMounted(() => {
  checkExistingSession()
})
</script>

<template>
  <div class="auth-gate">
    <div v-if="state.loading" class="auth-gate__splash">
      <div class="spinner" aria-label="Chargement" />
      <p>Chargement de la session…</p>
    </div>

    <div v-else-if="!state.isAuthenticated" class="auth-gate__overlay">
      <div class="card">
        <p class="eyebrow">FILM-IA Docs protégées</p>
        <h1>Connexion 4uth</h1>
        <p class="muted">Utilisez vos identifiants 4uth (<span class="mono">auth.keyops.fr</span>) pour accéder à la documentation interne.</p>

        <form class="form" @submit.prevent="handleLogin">
          <label>
            <span>Email</span>
            <input v-model="form.email" type="email" autocomplete="email" required />
          </label>

          <label>
            <span>Mot de passe</span>
            <input v-model="form.password" type="password" autocomplete="current-password" required />
          </label>

          <button class="btn" type="submit" :disabled="state.authenticating">
            <span v-if="state.authenticating">Connexion…</span>
            <span v-else>Se connecter</span>
          </button>
        </form>

        <p v-if="hasError" class="error">{{ state.error }}</p>
        <p class="hint">API auth: {{ authOrigin }}{{ authPath }}</p>
      </div>
    </div>

    <div v-else>
      <div class="auth-gate__topbar">
        <div class="pill">Connecté</div>
        <div class="profile">
          <div class="avatar">{{ (state.profile?.displayName || state.profile?.email || 'User').slice(0, 2).toUpperCase() }}</div>
          <div class="details">
            <strong>{{ state.profile?.displayName || state.profile?.email }}</strong>
            <small>{{ state.profile?.email }}</small>
          </div>
        </div>
        <button class="link" type="button" @click="logout">Déconnexion</button>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-gate {
  min-height: 100vh;
  position: relative;
  color: #e5e7eb;
}

.auth-gate__splash,
.auth-gate__overlay {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 20% 20%, rgba(110, 231, 183, 0.12), transparent 30%),
    radial-gradient(circle at 80% 10%, rgba(94, 234, 212, 0.1), transparent 25%),
    linear-gradient(135deg, #0b1224 0%, #0f172a 50%, #0b1224 100%);
  padding: 32px;
}

.card {
  width: min(420px, 100%);
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
  color: #7dd3fc;
  margin-bottom: 6px;
}

h1 {
  margin: 0 0 6px;
  font-size: 26px;
  color: #f8fafc;
}

.muted {
  color: #cbd5e1;
  margin-bottom: 18px;
}

.mono {
  font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.form {
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 600;
  color: #e2e8f0;
}

input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #f8fafc;
}

input:focus {
  outline: 2px solid #22d3ee;
  outline-offset: 0;
  border-color: #22d3ee;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.12);
}

.btn {
  margin-top: 6px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #22d3ee, #14b8a6);
  color: #0b1224;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 15px 40px rgba(20, 184, 166, 0.35);
}

.error {
  margin-top: 10px;
  color: #f87171;
  font-weight: 600;
}

.hint {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.auth-gate__topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
  font-weight: 700;
  font-size: 12px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #22d3ee, #14b8a6);
  color: #0f172a;
  font-weight: 800;
}

.details {
  display: grid;
  line-height: 1.2;
}

.details strong {
  color: #e2e8f0;
}

.details small {
  color: #94a3b8;
}

.link {
  margin-left: auto;
  background: none;
  border: none;
  color: #93c5fd;
  cursor: pointer;
  font-weight: 700;
  text-decoration: underline;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 5px solid rgba(255, 255, 255, 0.12);
  border-top-color: #22d3ee;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
