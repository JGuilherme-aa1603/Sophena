🎨 1. PALETA (pensada pro Sophena)

Objetivo:

calma
leitura confortável
sem agressividade
acessível
🎯 Paleta base
:root {
  /* BRAND */
  --color-primary: #355f4a;
  --color-primary-hover: #2d5240;
  --color-primary-soft: #e6efe9;

  /* BACKGROUND */
  --color-bg: #f6f5f2;
  --color-bg-gradient: linear-gradient(180deg, #f6f5f2 0%, #eae7df 100%);

  /* SURFACE */
  --color-surface: #ffffff;
  --color-surface-soft: #f3f2ef;

  /* TEXT */
  --color-text: #24332b;
  --color-text-secondary: #5f6f66;
  --color-text-muted: #8a978f;

  /* STATES */
  --color-success: #4caf50;
  --color-warning: #d6a84f;
  --color-error: #d9534f;

  /* BORDER */
  --color-border: #e2e0db;
}

👉 Essa paleta:

não cansa
funciona bem em mobile
mantém identidade consistente
🧱 2. DESIGN SYSTEM (estrutura real)
📦 Espaçamento
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

👉 regra:

nunca inventar espaçamento aleatório
🔘 Border radius
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 20px;
--radius-xl: 28px;

👉 seu padrão ideal:

cards → md
botões → lg
modais → xl
🌫️ Sombras
--shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.04);
--shadow-md: 0 6px 16px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.08);

👉 nunca use sombra forte

⏱️ Transições
--transition-fast: 120ms ease;
--transition-normal: 180ms ease;
🔤 3. TIPOGRAFIA
Hierarquia:
h1 {
  font-size: 28px;
  font-weight: 700;
}

h2 {
  font-size: 22px;
  font-weight: 600;
}

p {
  font-size: 16px;
}

.small {
  font-size: 14px;
  color: var(--color-text-secondary);
}

👉 regra:

máximo 3 tamanhos principais
consistência > variedade
🔘 4. BOTÕES (muito importante)
🎯 Primário
.btn-primary {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-lg);
  padding: 14px;
  box-shadow: var(--shadow-md);
}
⚪ Secundário
.btn-secondary {
  border: 1px solid var(--color-border);
  background: transparent;
}
🔴 Perigo
.btn-danger {
  color: var(--color-error);
}
📦 5. CARDS
.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}

👉 variação:

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
📱 6. DOCK (navegação)

Melhoria forte aqui:

Visual ideal:
fundo: surface
blur leve
sombra superior
.dock {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;

  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);

  display: flex;
  justify-content: space-around;
  padding: 10px;

  box-shadow: var(--shadow-lg);
}
Item ativo:
.dock-item.active {
  background: var(--color-primary);
  color: white;
  transform: scale(1.05);
}
🧠 7. MICROINTERAÇÕES
Hover/touch
.interactive {
  transition: var(--transition-fast);
}

.interactive:active {
  transform: scale(0.97);
}
Fade entrada
.fade-in {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
⚡ 8. FEEDBACK (faltando no seu sistema)
Toast
✔ Livro adicionado
❌ Erro ao adicionar

👉 sempre topo ou inferior

Loading
skeleton em listas
botão com spinner
🧠 9. UX REGRAS (IMPORTANTÍSSIMO)

Nunca quebrar isso:

✔ uma ação principal por tela
✔ linguagem simples
✔ botões grandes
✔ nada escondido
✔ feedback sempre visível