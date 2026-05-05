<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { bookOutline, documentTextOutline, peopleOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'

const router = useRouter()

const adminActions = [
  {
    id: 'users',
    title: 'Criar usuário',
    description: 'Cadastre uma nova pessoa e escolha se ela também poderá administrar o sistema.',
    actionLabel: 'Abrir criação de usuários',
    icon: peopleOutline,
    testId: 'open-admin-users',
    handler: openAdminUsers,
  },
  {
    id: 'logs',
    title: 'Ver registros',
    description: 'Acompanhe o que aconteceu no sistema e encontre avisos importantes.',
    actionLabel: 'Abrir registros',
    icon: documentTextOutline,
    testId: 'open-admin-logs',
    handler: openAdminLogs,
  },
  {
    id: 'books',
    title: 'Gerenciar livros',
    description: 'Busque livros cadastrados e apague o que não deve mais ficar disponível no sistema.',
    actionLabel: 'Abrir gerenciamento de livros',
    icon: bookOutline,
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
</script>

<template>
  <AuthenticatedScaffold page-class="admin-home-page">
    <header class="app-page-header admin-home-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Área administrativa</h1>
        <p class="app-page-subtitle">Escolha a tarefa que deseja fazer.</p>
      </div>
    </header>

    <section class="admin-summary app-fade-in">
      <div class="summary-badge">
        <strong>Admin</strong>
        <span>Atalhos rápidos para cuidar do acesso, acompanhar registros e gerenciar livros.</span>
      </div>
    </section>

    <div class="admin-home-grid app-fade-in" data-testid="admin-task-list">
      <article
        v-for="action in adminActions"
        :key="action.id"
        class="admin-home-task"
      >
        <div class="task-icon-wrap">
          <IonIcon
            class="task-icon"
            :icon="action.icon"
            aria-hidden="true"
            data-testid="admin-task-icon"
          />
        </div>

        <div class="task-copy">
          <h2>{{ action.title }}</h2>
          <p>{{ action.description }}</p>
        </div>

        <IonButton
          class="action-button"
          :data-testid="action.testId"
          @click="action.handler"
        >
          {{ action.actionLabel }}
        </IonButton>
      </article>
    </div>
  </AuthenticatedScaffold>
</template>

<style scoped>
.admin-home-header {
  justify-content: flex-start;
}

.summary-badge {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-bg);
  box-shadow: var(--shadow-sm);
}

.summary-badge strong {
  color: var(--color-heading);
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 500;
}

.summary-badge span,
.admin-home-task p {
  color: var(--color-muted);
}

.admin-home-grid {
  display: grid;
  gap: var(--space-sm);
}

.admin-home-task {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  box-shadow: var(--shadow-sm);
}

.task-icon-wrap {
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.task-icon {
  width: 1.35rem;
  height: 1.35rem;
}

.task-copy {
  min-width: 0;
  display: grid;
  gap: var(--space-xs);
}

.admin-home-task h2 {
  color: var(--color-heading);
  font-family: var(--font-serif);
  font-size: 20px;
  font-style: italic;
  font-weight: 500;
}

.action-button {
  grid-column: 1 / -1;
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3rem;
  font-weight: 500;
}

@media (min-width: 768px) {
  .admin-home-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .admin-home-task {
    align-content: start;
    grid-template-columns: auto minmax(0, 1fr);
  }
}
</style>
