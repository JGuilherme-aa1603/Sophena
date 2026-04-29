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

    <section class="admin-summary app-fade-in">
      <div class="summary-badge">
        <strong>Admin</strong>
        <span>Atalhos rápidos para cuidar do acesso, acompanhar registros e gerenciar livros.</span>
      </div>
    </section>

    <div class="admin-home-grid app-fade-in">
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
  --border-radius: var(--radius-lg);
}

.summary-badge {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: var(--shadow-sm);
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
  gap: var(--space-md);
}

.card-kicker {
  margin-bottom: var(--space-sm);
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-home-card h2 {
  margin-bottom: var(--space-sm);
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
}

.admin-home-card {
  background: rgba(255, 255, 255, 0.92);
}

.action-button {
  margin-top: var(--space-md);
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3rem;
  font-weight: 700;
}

@media (min-width: 768px) {
  .admin-home-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
