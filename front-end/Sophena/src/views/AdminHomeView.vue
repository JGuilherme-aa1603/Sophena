<script setup lang="ts">
import { IonButton, IonCard, IonCardContent } from '@ionic/vue'
import { useRouter } from 'vue-router'

import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'

const router = useRouter()

const adminActions = [
  {
    id: 'users',
    title: 'Criar usuário',
    description: 'Cadastre uma nova pessoa e escolha se ela também poderá administrar o sistema.',
    actionLabel: 'Abrir criação de usuários',
    testId: 'open-admin-users',
    handler: openAdminUsers,
  },
  {
    id: 'logs',
    title: 'Ver registros',
    description: 'Acompanhe o que aconteceu no sistema e encontre avisos importantes.',
    actionLabel: 'Abrir registros',
    testId: 'open-admin-logs',
    handler: openAdminLogs,
  },
  {
    id: 'books',
    title: 'Gerenciar livros',
    description: 'Busque livros cadastrados e apague o que não deve mais ficar disponível no sistema.',
    actionLabel: 'Abrir gerenciamento de livros',
    testId: 'open-admin-books',
    handler: openAdminBooks,
  },
]

async function openAdminUsers() {
  await router.push('/app/admin/users')
}

async function openAdminLogs() {
  await router.push('/app/admin/logs')
}

async function openAdminBooks() {
  await router.push('/app/admin/books')
}

async function goBack() {
  await router.push('/app')
}
</script>

<template>
  <AuthenticatedScaffold page-class="admin-home-page">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Área administrativa</h1>
        <p class="app-page-subtitle">Escolha a tarefa que deseja fazer.</p>
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

    <section class="admin-summary">
      <div class="summary-badge">
        <strong>Admin</strong>
        <span>Atalhos rápidos para cuidar do acesso, acompanhar registros e gerenciar livros.</span>
      </div>
    </section>

    <div class="admin-home-grid">
      <IonCard
        v-for="action in adminActions"
        :key="action.id"
        class="app-card admin-home-card"
      >
        <IonCardContent>
          <p class="card-kicker">Tarefa</p>
          <h2>{{ action.title }}</h2>
          <p>{{ action.description }}</p>

          <IonButton
            class="action-button"
            :data-testid="action.testId"
            @click="action.handler"
          >
            {{ action.actionLabel }}
          </IonButton>
        </IonCardContent>
      </IonCard>
    </div>
  </AuthenticatedScaffold>
</template>

<style scoped>
.back-button {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
  --border-radius: 999px;
}

.summary-badge {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgba(88, 113, 95, 0.18);
  border-radius: 1rem;
  background: rgba(255, 253, 249, 0.75);
}

.summary-badge strong {
  color: var(--color-heading);
  font-weight: 700;
}

.summary-badge span,
.admin-home-card p {
  color: var(--color-muted);
}

.admin-home-grid {
  display: grid;
  gap: 1rem;
}

.card-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-home-card h2 {
  margin-bottom: 0.6rem;
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 700;
}

.action-button {
  margin-top: 1rem;
  --background: var(--color-primary);
  --background-hover: var(--color-primary-strong);
  --border-radius: 999px;
  min-height: 3rem;
  font-weight: 700;
}

@media (min-width: 768px) {
  .admin-home-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
