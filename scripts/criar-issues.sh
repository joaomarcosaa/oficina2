#!/usr/bin/env bash
# Cria as issues iniciais no repositório atual. Requer: gh auth login
set -e
mk() { gh issue create --title "$1" --body "$2" --label "$3"; }

gh label create alta     --color d73a4a --force >/dev/null
gh label create media    --color fbca04 --force >/dev/null
gh label create backend  --color 0e8a16 --force >/dev/null
gh label create frontend --color 1d76db --force >/dev/null

mk "RF01 - Criar conta"                 "O sistema deve permitir que o usuário crie uma conta." "alta,backend,frontend"
mk "RF02 - Autenticação com Google"     "O sistema deve permitir autenticação utilizando uma conta Google." "alta,backend,frontend"
mk "RF03 - Iniciar atividade"           "O sistema deve permitir iniciar uma atividade de movimentação do personagem." "alta,backend,frontend"
mk "RF04 - Comandos pelas setas"        "O sistema deve permitir executar comandos utilizando as setas do teclado (e botões na tela)." "alta,frontend"
mk "RF05 - Exibir deslocamento"         "O sistema deve apresentar visualmente o deslocamento do personagem." "alta,frontend"
mk "RF06 - Reiniciar atividade"         "O sistema deve permitir reiniciar a atividade." "media,backend,frontend"
mk "RF07 - Instruções da atividade"     "O sistema deve apresentar instruções para a realização da atividade." "media,frontend"
mk "RF08 - Níveis de jogo"              "Organizar a atividade em níveis com dificuldade crescente, liberando o próximo ao concluir o atual. Ver docs/niveis.md." "media,backend,frontend"
mk "RF09 - Salvar progresso"            "Salvar níveis concluídos e nível atual do usuário e restaurar no próximo acesso. Ver docs/niveis.md." "alta,backend,frontend"
mk "Setup: banco de dados e modelos"    "Definir SQLite/PostgreSQL e criar as tabelas usuario, atividade, movimento, progresso." "alta,backend"
mk "Testes automatizados (Pytest/Jest)" "Cobrir auth, lógica de jogo e lógica de movimento do front." "media,backend,frontend"
