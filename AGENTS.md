# 🤖 AGENTS.md - Guia de Conduta e Auditoria Técnica

Este documento serve como o diário de bordo e manual de operações e padrões arquiteturais para o desenvolvimento do sistema **FinanZen**, guiando o comportamento das IAs de assistência.

## 🎯 Padrões de Projeto Ativos
- **Linguagem:** 100% Português (BR) para logs, docstrings, comentários e respostas aos usuários.
- **Clean Code & SRP:** Arquivos pequenos (máx ~400 linhas), funções de responsabilidade única.
- **Fail Fast & Validação Zero-Trust:** Todas as rotas de API possuem esquemas `Zod` rigorosos. Entradas externas não confiáveis são higienizadas imediatamente.
- **Tratamento de Erros:** Não existem `try/catch` vazios. Todos os logs de erro ou aviso usam `logger.error`/`logger.warn` com `traceId` estruturado para rastreabilidade.
- **Eficiência do Banco:** Optamos por operações relacionais sólidas (`JOIN` e relacionamentos Prisma) para evitar problemas de `N+1` e aliviar processamento em memória.

## 📈 Histórico de Auditoria e Implementação

### ✅ Fase 1: Fundação Arquitetural
- **Status:** Concluída e Validada.
- **Ações:**
  - Banco de Dados (Prisma) completamente reformulado de modo "Legado (Bot WhatsApp)" para "MVP Enterprise Multi-Filial".
  - Tabelas críticas adicionadas: `Branch`, `Customer`, `Supplier`, `BankAccount`, `ChartOfAccount`.
  - Integração Webhook refatorada para associar fluxos automáticos à nova arquitetura, blindando a entrada de dados.

### ✅ Fase 2: Módulo Multi-Filiais e Cadastros Base
- **Status:** Concluída e Validada.
- **Ações:**
  - **Backend (Fastify):** Criadas rotas CRUD seguras (`/branches`, `/customers`, `/suppliers`, `/bank-accounts`, `/chart-of-accounts`).
  - **Frontend (Next.js):** Arquitetadas 5 novas telas no Dashboard no formato Single Page Application (SPA), interativas e estilizadas via *Glassmorphism*.
  - O antigo modelo de Categorias simples e Limites foi descontinuado do frontend, estabilizando a aplicação para consultas orientadas a Plano de Contas.
  - Performance da UI preservada, utilizando `lucide-react` para iconografia empresarial e cores semânticas padronizadas.

### 🚧 Fase 3: Módulo Operacional e Transacional (Frente de Caixa e Lançamentos)
- **Status:** Em Andamento (Foco Atual).
- **Próximas Tarefas:**
  - Implementar "Frente de Caixa": Tela para lançamentos financeiros rápidos à vista.
  - Implementar listagens detalhadas e robustas para "Contas a Pagar" e "Contas a Receber" (com status pendente/pago/atrasado).
  - Lógicas avançadas no backend para realizar baixa parcial ou total de títulos.
  - Assegurar estrita validação de concorrência nos lançamentos.

### ✅ Hotfix 3.1: Exclusão Segura e Estabilidade de Memória
- **Status:** Concluído.
- **Problema:** Tentativa de excluir filiais/entidades com registros vinculados causava erro 500 genérico. A falha no frontend disparava re-renders em cascata via `router.refresh()` → recálculo pesado no `page.tsx` → esgotamento de memória e desligamento da máquina.
- **Correções Backend:**
  - Todas as rotas DELETE agora verificam dependências (transações, clientes, fornecedores, etc.) **antes** de tentar excluir.
  - Retorno HTTP 409 (Conflict) com mensagem semântica detalhando quais registros impedem a exclusão.
  - Tratamento granular de erros Prisma (P2003/P2025) em vez de 500 genérico.
  - GET de entidades agora inclui `_count` de registros filhos para o frontend exibir informações de dependência.
- **Correções Frontend:**
  - `ApiError` tipado no `api.ts` que preserva `statusCode` e `details` do backend para exibição na UI.
  - Timeout de segurança (15s) via `AbortController` em todas as requisições para evitar requests pendentes infinitamente.
  - `extractErrorMessage()` utilitário para exibir mensagens semânticas do backend na notificação.
  - Proteção contra duplo-clique em todos os botões de exclusão (`deletingId` state).
  - Loading states (`Loader2`) em todas as operações assíncronas.
  - `refreshData` estabilizado com `useCallback` para evitar re-criação de funções a cada render.
  - `page.tsx`: Limite de transações reduzido de 500→200 e early return no bloco de erro do Supabase.

---

## 📋 Checklist de Auditoria Contínua (Dívida Técnica & Evolução)

Este checklist vivo consolida as pendências de refatoração para garantir a aderência contínua ao Clean Code:

### 🛡️ Segurança & Compliance
- [ ] **CORS Restritivo:** `origin: "*"` é aceitável apenas em `development`. Em `production`, o CORS deve listar domínios explícitos.

### 🧪 Testes e Qualidade
- [ ] **Cobertura Mínima (80%):** Criar testes unitários e suítes com mocks para `extractFinancialData` e integrações críticas da API.
- [ ] **Testes de Integração:** Criar cenários de integração para as rotas CRUD usando banco em memória ou fixtures.

### ⚡ Performance e UX
- [x] **Re-renders Desnecessários:** `useCallback` aplicado em `refreshData` e funções de load. Proteção contra duplo-clique com `deletingId` state. (Hotfix 3.1)
- [ ] **Instância Intl:** Mover a criação de instâncias de formatação de moeda para foras de iterações/componentes.

---

*Nota de Desenvolvimento:* Ao finalizar módulos maiores, registre sistematicamente os avanços neste arquivo e em `README.md` e `PROJETO.md`.