# Plano de Desenvolvimento: Sistema FinanZen (MVP)

Este documento estabelece o roadmap de execução técnica para o desenvolvimento do MVP do sistema FinanZen, baseado na [Especificação Técnica e Funcional](./Especificação%20Técnica%20e%20Funcional_Projeto%20Clone%20Sistema%20XFIN.md). A arquitetura prioriza o **Clean Code**, alta coesão e segurança, estabelecendo uma fundação sólida e escalável.

---

## Fase 1: Fundação Arquitetural e Modelagem de Dados (Semanas 1-2)
**Objetivo:** Estabelecer a base do sistema, definindo as entidades de banco de dados e as políticas globais de acesso e observabilidade.

- **Modelagem de Dados Relacional (Evitando N+1):**
  - Criação das tabelas fundamentais: `Users`, `Branches` (Filiais), `Customers`, `Suppliers`, `BankAccounts`, `ChartOfAccounts` (Plano de Contas) e `Transactions`.
  - Índices e relacionamentos adequados para otimizar agregações futuras.
- **Autenticação e Perfis (RF001, RF002):**
  - Sistema de Login (E-mail/Senha).
  - Módulo de gerenciamento de perfil e upload de logotipos.
- **Observabilidade e Logs Estruturados:**
  - Configuração de logger (ex: Pino/Winston) nos níveis estratégicos (ERROR, WARN, INFO, DEBUG).
  - Injeção de *Trace IDs* nas requisições.
  - Middlewares de tratamento de erros globais (Fail Fast).

## Fase 2: Módulo Multi-Filiais e Cadastros Base (Semana 3)
**Objetivo:** Estruturar as opções gerenciais que alimentarão os lançamentos financeiros.

- **Arquitetura Multi-Filiais (RF003):**
  - CRUD de Filiais.
  - **Seletor de Contexto:** Middleware que intercepta as chamadas e filtra rigorosamente os dados baseados na filial ativa (ou exibição consolidada para a matriz).
- **Cadastros de Apoio (Seção 6):**
  - CRUD de Clientes, Fornecedores e Contas Bancárias.
  - Cadastro e hierarquização do Plano de Contas (vinculação obrigatória DRE/Fluxo de Caixa).
  - Ferramenta de importação de Plano de Contas via arquivo externo.

## Fase 3: Módulo Operacional e Transacional (Semanas 4-5)
**Objetivo:** Desenvolver o "Coração" do sistema, garantindo higienização de inputs e transações consistentes.

- **Frente de Caixa (Seção 4.1):**
  - Lançamentos rápidos e diretos à vista.
- **Contas a Receber (4.2) e Contas a Pagar (4.3):**
  - Telas completas de gestão com listagens, busca e paginação.
  - Controle de status de liquidação (Pago, Pendente, Atrasado).
  - Lógicas de baixa total e parcial de títulos.
- **Segurança (Zero Trust):**
  - Validação estrita de todos os payloads e lógicas defensivas contra concorrência ao baixar contas.

## Fase 4: Inteligência Financeira e Relatórios (Semanas 6-7)
**Objetivo:** Transformar dados brutos em inteligência corporativa, aplicando agregações complexas.

- **Motor do Fluxo de Caixa (Seção 5.1):**
  - Construção da visão diária (Realizado e Projetado).
  - Montagem da visão mensal (Saldo Inicial -> Entradas -> Saídas -> Saldo Final).
- **DRE Automatizada (RN002 / Seção 5.2):**
  - Conversão da base transacional para a lógica de **Regime de Competência**.
  - Cálculo de Faturamento Bruto, Margem de Contribuição e Lucro Líquido.
  - Implementação da Análise Vertical.
- *Nota de Performance:* Exigência de construção via queries agregadas no banco para preservar memória e tempo de resposta na API.

## Fase 5: Dashboard Visual e Insights (Semana 8)
**Objetivo:** Apresentar a liquidez da empresa de forma clara, esteticamente moderna e assertiva.

- **Cards de Status (Seção 3.1):**
  - Consumo de dados para exibir a soma de Pagar/Receber em atraso e em aberto no mês.
- **Motor de Projeção de 15 Dias (RN001 / Seção 3.2):**
  - Cálculo de fluxo de caixa restrito à quinzena subsequente, alertando furos de caixa preventivamente.
- **Componentes Gráficos (Seção 3.3):**
  - Gráficos de rosca demonstrando composição de Entradas e Saídas.
  - Gráfico de linha mapeando a evolução do Saldo Bancário.
  - Implementação dos filtros de período e conta bancária conectados a todos os widgets da tela.

## Fase 6: Finalização, Exportação e Testes (Semana 9)
**Objetivo:** Polimento técnico, geração de relatórios físicos e validação de qualidade (QA).

- **Exportações e Saídas:**
  - Motor de conversão de listagens (Entradas, Saídas e Consolidado) para formatos `.pdf` e `.xlsx`.
- **Suporte ao Usuário:**
  - Widget de redirecionamento WhatsApp respeitando o horário de expediente.
  - Área reservada para vídeos tutoriais.
- **Cobertura de Testes:**
  - Aplicação de Mocks/Stubs e testes unitários garantindo ao menos 80% de cobertura nos calculadores críticos (DRE e Fluxo de Caixa).
