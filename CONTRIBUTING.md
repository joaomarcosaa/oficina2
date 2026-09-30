# Como contribuir

1. Pegue uma **issue** do backlog e atribua a você.
2. Atualize a `main` e crie uma branch a partir dela: `git switch -c feat/rf04-setas-teclado`
3. Faça commits pequenos e claros (veja o padrão em [docs/guia-git.md](docs/guia-git.md)).
4. Rode os testes localmente (`pytest` e/ou `npm test`) antes de abrir o PR.
5. Abra um **Pull Request** para a `main` referenciando a issue (`Closes #N`).
6. **Pelo menos 1 colega** precisa revisar e aprovar antes do merge.
7. Nunca faça push direto na `main`.

## Padrão de nomes de branch
- `feat/<rf>-<descricao>` — nova funcionalidade
- `fix/<descricao>` — correção de bug
- `docs/<descricao>` — documentação
- `test/<descricao>` — testes
