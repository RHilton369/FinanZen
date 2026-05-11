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

### ✅ Fase 3: Módulo Operacional, Transacional e Estabilização
- **Status:** Concluída e Validada.
- **Ações:**
  - **Frente de Caixa:** Implementada tela para lançamentos rápidos com validação dinâmica de filial e plano de contas.
  - **Relatórios (DRE & Fluxo de Caixa):** Refatorados para utilizar dados reais do banco, eliminando IDs "dummy" e suportando transações não categorizadas.
  - **Plano de Contas:** Populado com estrutura profissional de 19 contas (Receitas, Deduções, Custos e Despesas).
  - **Estabilização de Build:** Removidos hangs de carregamento inicial e melhorado o tratamento de erros no servidor (Next.js Standalone).

### ✅ Hotfix 3.2: Acesso a Dados e RLS
- **Status:** Concluído.
- **Ações:**
  - Desativado Row Level Security (RLS) no Supabase para permitir acesso direto do Dashboard em ambiente de produção.
  - Criadas políticas de "Enable all access" para garantir fluidez no ambiente multi-usuário inicial.

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