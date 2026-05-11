
Para atender ao seu pedido o Sistema FinanZen, eu criei um **relatório detalhado** que serve como um **roteiro técnico e funcional (blueprint)** completo. Este documento organiza todas as informações das fontes para que a estrutura, os cálculos e as interfaces do sistema possam ser replicados fielmente.

O relatório detalha os requisitos para os seguintes componentes principais descritos nas fontes:

- **Dashboard de Controle Imediato:** Com cards de indicadores para contas em atraso, em aberto e fluxo de caixa projetado para os próximos 15 dias.
- **Painel Gerencial Visual:** Incluindo gráficos de rosca para composição de receitas e despesas, além da evolução de saldo bancário.
- **Módulos Financeiros Estruturados:** Regras para o funcionamento da **DRE automatizada** (com análise vertical e margem de contribuição), **Fluxo de Caixa** (diário, mensal, realizado e projetado) e gestão de movimentações à vista.
- **Gestão Operacional:** Cadastros de clientes, fornecedores, múltiplos bancos e o sistema de gestão multi-filiais.
- **Configurações e Suporte:** Estrutura do plano de contas vinculado aos relatórios e a integração com canais de suporte.

O artefato foi gerado e estará disponível em breve na sua aba de **Estúdio**. Lembre-se de que a criação pode levar alguns minutos.

# Especificação Técnica e Funcional: Projeto  Sistema FinanZen

## 1. Visão Geral do Sistema e Objetivos

O sistema FinanZen é projetado como uma solução robusta para a gestão financeira de pequenos negócios, representando a evolução tecnológica de uma metodologia de controle baseada em planilhas que já atende mais de 7.000 empresas em todo o Brasil. Este projeto foca no desenvolvimento do **MVP (Minimum Viable Product)**, visando migrar a lógica comprovada do legado para uma plataforma escalável e integrada.

**Objetivos Centrais:**

- **Migração de Legado:** Transpor a inteligência financeira de planilhas para um ambiente web centralizado.
- **Eficiência Operacional:** Automatizar processos de registro e conciliação para pequenos empreendedores.
- **Suporte à Decisão:** Fornecer indicadores visuais precisos para análise econômica e financeira.
- **Controle de Inadimplência:** Mitigar perdas através de um monitoramento rigoroso de contas a receber (incluindo vendas na modalidade "fiado").

## 2. Arquitetura de Acesso e Gestão Multi-Filiais

O sistema deve suportar uma estrutura hierárquica que permite a gestão individual ou consolidada de unidades de negócio.

- **Autenticação (RF001):** Acesso via e-mail e senha.
- **Personalização de Perfil (RF002):** Configurações de nome, e-mail, telefone/celular e upload de logotipo para personalização do ambiente.
- **Módulo de Multi-Filiais (RF003):**
    - **Cadastro de Filiais:** Interface específica para registro de novas unidades de negócio.
    - **Seletor de Contexto:** Após o login, o usuário deve obrigatoriamente selecionar entre a visualização de uma filial específica ou da matriz.
    - **Consolidação:** Lógica de processamento que permite a soma de indicadores de múltiplas unidades para uma visão global do grupo econômico.

## 3. Módulo Dashboard: Painel Gerencial de Indicadores

O dashboard deve consolidar as informações críticas de liquidez e desempenho de forma visual e intuitiva.

### 3.1 Indicadores de Status (Cards)

A tela inicial apresentará quatro cards obrigatórios:

1. **Contas a Receber em Atraso:** Soma de títulos vencidos até a data presente.
2. **Contas a Receber em Aberto:** Soma de títulos com vencimento no mês corrente.
3. **Contas a Pagar em Aberto:** Soma de compromissos com vencimento no mês corrente.
4. **Contas a Pagar em Atraso:** Soma de obrigações vencidas e não quitadas.

### 3.2 Lógica de Curto Prazo (Janela de 15 Dias)

**Regra de Negócio (RN001):** O sistema deve calcular o Fluxo de Caixa Projetado para os próximos 15 dias corridos, visando antecipar gargalos de liquidez. Este cálculo deve considerar o saldo atual somado às previsões de recebimento menos os pagamentos agendados no período.

- Exibição de indicadores específicos para Contas a Pagar e Receber vencendo estritamente dentro deste intervalo de 15 dias.

### 3.3 Visualização de Composição e Gráficos

- **Gráficos de Rosca:** Utilizados para Análise de Composição:
    - **Entradas:** Origem dos recursos (Ex: Prestação de Serviços vs. Vendas de Produtos).
    - **Saídas:** Destinação dos recursos por categoria de gasto.
- **Gráfico de Linha (Evolução de Saldo):** Deve demonstrar o comportamento histórico do saldo bancário.
    - **Interatividade:** O gráfico deve reagir dinamicamente ao filtro de seleção de "Banco".
- **Filtros Gerais:** Seleção de período (Data Início/Fim) e Conta Bancária específica.

## 4. Gestão de Operações Financeiras

### 4.1 Movimentações Financeiras (Lançamentos Rápidos)

Funcionalidade de "Frente de Caixa" para registros imediatos (regime de caixa), como compras de suprimentos de escritório ou vendas rápidas à vista, que não necessitam de agendamento futuro.

### 4.2 Controle de Contas a Receber

Interface focada na gestão de recebíveis e controle de crédito.

|   |   |   |
|---|---|---|
|Campo|Tipo de Dado|Filtro Disponível?|
|Cliente|String/Relacional|Sim|
|Valor do Título|Decimal|Não|
|Valor Pago|Decimal|Não|
|Saldo em Aberto|Decimal|Não|
|Data de Vencimento|Date|Sim|
|Status (Pago/Pendente/Atrasado)|Enum|Sim|
|Período de Referência|Date Range|Sim|

### 4.3 Controle de Contas a Pagar

Monitoramento de compromissos com fornecedores, permitindo a gestão de prazos e suporte para renegociações de vencimentos.

## 5. Inteligência Financeira e Relatórios Automatizados

### 5.1 Fluxo de Caixa (Visão Financeira)

O sistema deve operar com duas perspectivas de fluxo:

- **Diário:** Detalhamento transacional suportando dados **Realizados** e **Projetados**, com filtros por banco.
- **Mensal:** Estrutura verticalizada:
    1. (+) Saldo Inicial
    2. (+) Entradas
    3. (-) Saídas
    4. (=) Saldo Operacional (Entradas - Saídas)
    5. (=) Saldo Final (Saldo Inicial + Saldo Operacional)

### 5.2 Demonstrativo de Resultados do Exercício - DRE (Visão Econômica)

**Regra de Negócio (RN002):** A DRE deve ser gerada automaticamente com base no **Regime de Competência**. O lançamento deve impactar o relatório no mês de sua ocorrência econômica, independentemente da data de liquidação financeira.

**Hierarquia de Drill-down:**

- **Receita com Vendas**
    - Receita de Produtos
    - Receita de Prestação de Serviços
- **Gastos de Pessoal**
    - Pró-labore
    - Salários
    - Encargos Sociais e Trabalhistas (FGTS, INSS, etc.)
    - Benefícios (Transporte, Alimentação)

**Indicadores Econômicos Obrigatórios:**

- **Faturamento Bruto:** Soma total das receitas.
- **Margem de Contribuição:** Valor absoluto e percentual.
- **Lucro Líquido:** Resultado final após todas as deduções.
- **Análise Vertical:**

## 6. Configurações e Cadastros de Apoio

### 6.1 Plano de Contas e Importação

- **Customização:** Criação e edição de categorias financeiras.
- **Vínculo Estrutural:** Cada categoria deve ser vinculada obrigatoriamente a uma conta mestre da DRE e do Fluxo de Caixa.
- **Importação:** Funcionalidade para "subir" planos de contas pré-existentes via arquivo de dados.

### 6.2 Cadastros Base e Suporte

- **Clientes e Fornecedores:** Dados cadastrais completos.
- **Contas Bancárias:** Cadastro ilimitado de contas para conciliação bancária múltipla.
- **Tipos de Documentos:** Classificação (NF, Recibo, Boleto).
- **Suporte e Treinamento:**
    - Botão de redirecionamento para Suporte via WhatsApp.
    - **Horário de Atendimento:** Segunda a Sábado, das 10:00 às 19:00.
    - Acesso a vídeos tutoriais integrados na plataforma.

## 7. Exportação de Dados e Saídas

|   |   |   |   |
|---|---|---|---|
|Relatório / Dado|Formato PDF|Formato Excel (.xlsx)|Visualização em Tela|
|Lançamentos de Entradas|Sim|Sim|Sim|
|Lançamentos de Saídas|Sim|Sim|Sim|
|Relatórios Financeiros Consolidados|Sim|Sim|Sim|

## 8. Roadmap de Expansão (Pós-MVP)

Funcionalidades planejadas para versões futuras:

- **Controle de Estoque:** Gestão de inventário e giro de produtos.
- **Módulo de Precificação:** Calculadora inteligente para formação de preço de venda baseada em custos e margens.
- **Ordem de Serviço (OS):** Gestão de fluxo de trabalho para empresas prestadoras de serviço.
- **Academia Caixa Direto:** Portal de educação corporativa com treinamentos focados em:
    - Gestão de Finanças e Fluxo de Caixa.
    - Estratégias de Precificação.
    - Empreendedorismo e Plano de Negócios.