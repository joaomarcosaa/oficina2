# Níveis e progresso do labirinto 3D

## Campanha implementada

O jogo possui dez fases, aprovadas no escopo atual. O tamanho e o comprimento mínimo do caminho até a saída crescem em todas as fases:

| Fase | Tamanho | Menor caminho até a saída |
|------|---------|--------------------------|
| 1 | 7 × 7 | 16 movimentos |
| 2 | 9 × 9 | 24 movimentos |
| 3 | 11 × 11 | 38 movimentos |
| 4 | 13 × 13 | 58 movimentos |
| 5 | 15 × 15 | 66 movimentos |
| 6 | 17 × 17 | 98 movimentos |
| 7 | 19 × 19 | 106 movimentos |
| 8 | 21 × 21 | 146 movimentos |
| 9 | 23 × 23 | 166 movimentos |
| 10 | 25 × 25 | 212 movimentos |

Os mapas completos estão em `backend/app/levels.json`. O gerador `frontend/src/maze.js` usa busca em profundidade com semente e escolhe uma meta alcançável distante do início. A câmera fica atrás do personagem: frente/trás deslocam segundo sua orientação; direita/esquerda giram 90 graus. Bater na parede não altera posição nem pontuação. O minimapa mostra personagem, paredes e saída.

Ao chegar ao portal, a interface envia os comandos para o servidor, que refaz o caminho antes de liberar a próxima fase. A conclusão fica salva por usuário na tabela `progresso`, com o melhor número de movimentos; ao entrar novamente, o usuário retoma a última fase liberada. Reiniciar não apaga fases concluídas. A fase 10 apresenta o fim da campanha, sem tentar carregar uma fase 11.

O escopo implementado não inclui itens, limite de movimentos, estrelas ou tela para escolher qualquer fase; estes eram possibilidades do rascunho abaixo. No momento, a navegação avança pela campanha e permite reiniciar ou jogar novamente após a fase 10.

## Rascunho anterior (referência de planejamento)

## Conceito
Cada **nível** é uma atividade de movimentação com um objetivo: levar o personagem da posição inicial até a **meta** usando os comandos `frente`, `trás`, `direita` e `esquerda`. A dificuldade aumenta a cada nível.

Um nível só é liberado quando o anterior foi concluído. O primeiro começa liberado.

## Proposta de níveis (ajustem com o grupo)

| Nível | Nome | Grade | Elementos | Objetivo |
|-------|------|-------|-----------|----------|
| 1 | Primeiros passos | 5×5 | Sem obstáculos | Chegar à meta (tutorial, serve também para RF07) |
| 2 | Desvio | 6×6 | Poucos obstáculos | Chegar à meta desviando |
| 3 | Corredor | 8×8 | Obstáculos formando corredores + limite de movimentos | Chegar à meta dentro do limite |
| 4 | Colecionador | 8×8 | Itens espalhados + obstáculos | Coletar todos os itens e chegar à meta |
| 5 | Labirinto | 10×10 | Labirinto | Chegar à meta com poucos movimentos |

## Regras
- **Conclusão:** o nível termina quando o personagem alcança a meta (e, no nível 4, coletou todos os itens).
- **Pontuação (opcional):** 1 a 3 estrelas conforme o número de movimentos usados em relação ao mínimo do nível.
  - 3 estrelas: até o mínimo; 2 estrelas: até 1,5× o mínimo; 1 estrela: concluiu.
- **Colisão:** mover contra um obstáculo ou contra a borda da grade não desloca o personagem.
- **Reiniciar (RF06):** volta ao estado inicial do nível atual, sem perder o progresso já salvo.

## Formato de definição de nível (JSON versionado no repositório)

Sugestão: guardar os níveis em arquivo (ex.: `backend/app/levels.json`) em vez de no banco, assim todo o grupo revisa via PR.

```json
{
  "id": 3,
  "nome": "Corredor",
  "grade": { "largura": 8, "altura": 8 },
  "inicio": { "x": 0, "y": 0 },
  "meta": { "x": 7, "y": 7 },
  "obstaculos": [{ "x": 2, "y": 0 }, { "x": 2, "y": 1 }],
  "itens": [],
  "limite_movimentos": 20,
  "movimentos_minimos": 14
}
```

Convenção de coordenadas (a mesma de `frontend/src/movement.js`): origem `(0,0)` no canto superior esquerdo, `x` cresce para a direita e `y` cresce para baixo (`frente` = `y - 1`).

## Progresso (RF09)

**O que é salvo**
- Por usuário e por nível: se foi concluído, melhor número de movimentos e estrelas.
- Nível atual do usuário (último desbloqueado).

**Quando salva**
- Automaticamente ao concluir um nível.
- Ao fazer login, o sistema carrega o progresso e libera os níveis correspondentes.

**Regras**
- Só o próprio usuário lê e altera o seu progresso.
- Refazer um nível só substitui o resultado salvo se o novo for melhor.
- O servidor valida a conclusão (repete/valida a sequência de movimentos); o front-end não decide sozinho que o nível foi concluído.

## Impacto no código
- `frontend/src/movement.js`: `mover()` precisa receber `obstaculos` para bloquear movimentos (hoje só trata os limites da grade).
- Novas telas: seleção de níveis (com bloqueados/concluídos/estrelas) e tela de nível concluído.
