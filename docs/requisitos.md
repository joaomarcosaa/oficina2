# Requisitos

## Descrição
Ferramenta visual para programação de um pequeno personagem que anda pela tela com comandos básicos (frente, trás, direita, esquerda), controlado por botões na tela ou setas do teclado.

## Requisitos funcionais

| ID | Descrição | Prioridade |
|----|-----------|-----------|
| RF01 | O sistema deve permitir que o usuário crie uma conta. | Alta |
| RF02 | O sistema deve permitir autenticação utilizando uma conta Google. | Alta |
| RF03 | O sistema deve permitir iniciar uma atividade de movimentação do personagem. | Alta |
| RF04 | O sistema deve permitir executar comandos utilizando as setas do teclado. | Alta |
| RF05 | O sistema deve apresentar visualmente o deslocamento do personagem. | Alta |
| RF06 | O sistema deve permitir reiniciar a atividade. | Média |
| RF07 | O sistema deve apresentar instruções para a realização da atividade. | Média |
| RF08 | O sistema deve organizar a atividade em níveis de jogo com dificuldade crescente, liberando o próximo nível ao concluir o atual. | Média |
| RF09 | O sistema deve salvar o progresso do usuário (níveis concluídos e nível atual) e restaurá-lo em um novo acesso. | Alta |

> Esquema de níveis e regras de progresso: [niveis.md](niveis.md). As prioridades de RF08 e RF09 são propostas; ajustem com o grupo.

## Critérios de aceite (proposta — ajustem com o grupo)

- **RF01:** dado um e-mail e senha válidos, a conta é criada e o usuário consegue fazer login; e-mail duplicado retorna erro claro.
- **RF02:** o botão "Entrar com Google" autentica o usuário e cria a conta caso seja o primeiro acesso.
- **RF03:** após autenticado, o botão "Iniciar" exibe a tela do jogo com o personagem na posição inicial.
- **RF04:** as setas ↑ ↓ ← → movem o personagem; os botões na tela têm o mesmo efeito.
- **RF05:** o deslocamento é animado/atualizado na tela a cada comando.
- **RF06:** "Reiniciar" devolve o personagem à posição inicial e limpa os comandos executados.
- **RF07:** as instruções ficam visíveis antes/durante a atividade.
- **RF08:** existem pelo menos 3 níveis com dificuldade crescente; há uma tela de seleção mostrando níveis liberados, bloqueados e concluídos; ao alcançar a meta o próximo nível é liberado; níveis bloqueados não podem ser abertos.
- **RF09:** ao concluir um nível o progresso é salvo automaticamente; ao sair e entrar novamente o usuário vê os mesmos níveis concluídos e retoma do último nível liberado; refazer um nível só substitui o resultado se for melhor; um usuário nunca acessa o progresso de outro.

## Restrições
- Front-end em HTML/JS; back-end em Python; banco SQLite ou PostgreSQL.
- Testes automatizados com Pytest (back-end) e Jest (front-end).

## Decisões em aberto (definir em grupo)
- [ ] Framework do back-end (sugestão: Flask).
- [ ] SQLite ou PostgreSQL.
- [ ] Tamanho da grade e posição inicial do personagem.
- [ ] O que exatamente é salvo: apenas níveis concluídos (mais simples) ou também a posição no meio de um nível?
- [ ] Quantos níveis serão entregues e se haverá pontuação por estrelas.
- [ ] O movimento é imediato (tempo real) ou o usuário monta uma sequência de comandos e depois executa?
