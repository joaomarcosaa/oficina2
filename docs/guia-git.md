# Guia de Git e fluxo de trabalho

## Configuração inicial do repositório (feita por uma pessoa)

1. Crie o repositório no GitHub (ex.: `oficina2-personagem`).
2. Em **Settings → Collaborators**, adicione as outras 3 pessoas (ou crie uma Organization).
3. Em **Settings → Branches → Add rule** para `main`:
   - ✅ Require a pull request before merging (1 aprovação)
   - ✅ Require status checks to pass (o workflow **CI**)
4. Suba este projeto:
```bash
git init -b main
git add .
git commit -m "chore: estrutura inicial do projeto"
git remote add origin https://github.com/<usuario>/oficina2-personagem.git
git push -u origin main
```

## Cada integrante
```bash
git clone https://github.com/<usuario>/oficina2-personagem.git
cd oficina2-personagem
```

## Ciclo de trabalho
```bash
git switch main && git pull                # atualiza a main
git switch -c feat/rf04-setas-teclado      # cria sua branch
# ...trabalha...
git add .
git commit -m "feat(front): captura das setas do teclado (RF04)"
git push -u origin feat/rf04-setas-teclado
# abre o Pull Request no GitHub
```

## Padrão de commits (Conventional Commits)
`tipo(escopo): descrição` — tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Conflitos
```bash
git switch minha-branch
git fetch origin
git merge origin/main       # resolve os conflitos, depois:
git add . && git commit
```

## Boas práticas
- Branches curtas, PRs pequenos.
- Nunca commitar `.env`, senhas ou o `client_secret` do Google.
- Comunicar no grupo quando mexer em arquivos compartilhados.
