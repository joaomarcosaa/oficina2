# Esquema de níveis (RF08) e progresso (RF09)

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
