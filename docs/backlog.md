# Backlog e divisão de tarefas

Sugestão de divisão para 4 pessoas (ajustem conforme o perfil de cada um).

| Requisito | Tarefa | Prioridade | Responsável sugerido |
|-----------|--------|-----------|----------------------|
| — | Setup do repositório, CI e estrutura de pastas | Alta | Pessoa 4 |
| — | Modelo do banco de dados e camada de acesso | Alta | Pessoa 4 |
| RF01 | Cadastro de conta (API + tela) | Alta | Pessoa 1 |
| RF02 | Login com Google (OAuth) | Alta | Pessoa 1 |
| RF03 | Iniciar atividade (API + tela do jogo) | Alta | Pessoa 2 |
| RF05 | Exibir deslocamento do personagem | Alta | Pessoa 2 |
| RF07 | Tela/painel de instruções | Média | Pessoa 2 |
| RF04 | Controle por setas do teclado e botões | Alta | Pessoa 3 |
| RF06 | Reiniciar atividade | Média | Pessoa 3 |
| RF08 | Definição dos níveis (JSON), obstáculos/meta em `mover()` e tela de seleção de níveis | Média | Pessoa 3 (front) e Pessoa 2 (tela) |
| RF09 | Salvar e carregar progresso (tabela `progresso`, rotas `/game/progress` e `/complete`) | Alta | Pessoa 4 (com apoio da Pessoa 1) |
| — | Testes Pytest (auth e lógica de jogo) | Média | Pessoa 1 e 4 |
| — | Testes Jest (movimento e controller) | Média | Pessoa 2 e 3 |
| — | Documentação final e apresentação | Média | Todos |

## Ordem sugerida (sprints)
1. **Sprint 1:** setup, banco, esqueleto da API, tela do jogo estática.
2. **Sprint 2:** RF01, RF03, RF04, RF05 funcionando de ponta a ponta; definir o formato dos níveis (RF08).
3. **Sprint 3:** RF08, RF09, RF02, RF06, RF07, testes e polimento.

> Para criar as issues automaticamente no GitHub: `bash scripts/criar-issues.sh` (requer o [GitHub CLI](https://cli.github.com/) autenticado com `gh auth login`).
