# 🧼 Arquitetura e Clean Code no FinanZen

O projeto FinanZen segue rigorosamente princípios de **Clean Code** para garantir manutenibilidade e escalabilidade.

## Princípios Fundamentais
1. **SRP (Single Responsibility Principle):** Cada função ou classe faz apenas uma coisa.
2. **Nomenclatura Semântica:** Nomes descrevem o domínio do negócio, não o tipo do dado.
3. **Fail Fast (Early Returns):** Validações no início para evitar aninhamento desnecessário (Anti-pattern Hadouken).
4. **Tipagem Obrigatória:** Uso extensivo de TypeScript/Interfaces.

## Como Aplicar
- Sempre que criar um novo serviço, verifique se ele pode ser testado isoladamente.
- Use logs estruturados (JSON) para observabilidade.

## Relacionados
- [[PROJETO.md|Regras de Negócio]]
- [[Documentacao_Tecnica.md|Tecnologias Utilizadas]]

---
*Tags: #conhecimento #arquitetura #cleancode*
