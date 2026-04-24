<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const greeting = computed(() => {
  if (!authStore.user) {
    return 'Sua sessão está pronta.'
  }

  return `Olá, ${authStore.user.user_name}.`
})

async function exitSession() {
  authStore.clearSession()
  await router.replace('/login')
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="app-home">
        <section class="app-home-card">
          <p class="app-home-kicker">Área principal</p>
          <h1>{{ greeting }}</h1>
          <p>
            Seu acesso foi confirmado. As próximas áreas da aplicação serão adicionadas nas próximas etapas.
          </p>

          <IonButton class="exit-button" fill="outline" @click="exitSession">
            Sair desta tela
          </IonButton>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.app-home {
  min-height: 100%;
  display: grid;
  align-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top right, rgba(223, 236, 221, 0.95), transparent 30%),
    linear-gradient(180deg, #f6f4ee 0%, #fcfbf7 100%);
}

.app-home-card {
  width: min(100%, 32rem);
  margin: 0 auto;
  padding: 1.75rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
  color: #22352d;
}

.app-home-kicker {
  margin-bottom: 0.5rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.app-home-card h1 {
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.app-home-card p {
  margin-top: 0.9rem;
}

.exit-button {
  margin-top: 1.25rem;
  --color: #335c47;
  --border-color: #335c47;
  --border-radius: 0.95rem;
}
</style>
