<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonContent, IonPage } from '@ionic/vue'
import { useRouter } from 'vue-router'

const router = useRouter()

async function openAdminUsers() {
  await router.push('/app/admin/users')
}

async function openAdminLogs() {
  await router.push('/app/admin/logs')
}

async function goBack() {
  await router.push('/app')
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="admin-home-page">
        <section class="admin-home-shell">
          <header class="admin-home-header">
            <div>
              <p class="admin-home-kicker">Sophena</p>
              <h1>Área administrativa</h1>
              <p class="admin-home-subtitle">Escolha a tarefa que deseja fazer.</p>
            </div>

            <IonButton
              class="back-button"
              fill="outline"
              data-testid="back-to-app"
              @click="goBack"
            >
              Voltar
            </IonButton>
          </header>

          <div class="admin-home-grid">
            <IonCard class="admin-home-card">
              <IonCardContent>
                <h2>Criar usuário</h2>
                <p>Cadastre uma nova pessoa e escolha se ela também poderá administrar o sistema.</p>

                <IonButton
                  class="action-button"
                  data-testid="open-admin-users"
                  @click="openAdminUsers"
                >
                  Abrir criação de usuários
                </IonButton>
              </IonCardContent>
            </IonCard>

            <IonCard class="admin-home-card">
              <IonCardContent>
                <h2>Ver registros</h2>
                <p>Acompanhe o que aconteceu no sistema e encontre avisos importantes.</p>

                <IonButton
                  class="action-button"
                  data-testid="open-admin-logs"
                  @click="openAdminLogs"
                >
                  Abrir registros
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.admin-home-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(223, 236, 221, 0.9), transparent 28%),
    radial-gradient(circle at bottom right, rgba(239, 229, 198, 0.8), transparent 28%),
    linear-gradient(180deg, #f6f2e8 0%, #fcfbf7 100%);
}

.admin-home-shell {
  width: min(100%, 46rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.admin-home-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.admin-home-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-home-header h1 {
  color: #20332b;
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.admin-home-subtitle {
  margin-top: 0.65rem;
  color: #476055;
}

.admin-home-grid {
  display: grid;
  gap: 1rem;
}

.admin-home-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
}

.admin-home-card h2 {
  margin: 0 0 0.6rem;
  color: #20332b;
  font-size: 1.25rem;
}

.admin-home-card p {
  margin: 0;
  color: #476055;
}

.action-button {
  margin-top: 1rem;
  --background: #335c47;
  --background-hover: #284b3a;
  --border-radius: 0.95rem;
  min-height: 3rem;
  font-weight: 700;
}

@media (min-width: 768px) {
  .admin-home-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
