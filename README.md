# Fashion Seminar Demo

A seminar app showing how captured fashion product pages support a recommendation for a shopper request. Reports show product information, supporting evidence, conflicts, unknowns, and a PDP readiness audit.

## Local setup

See [SETUP.md](SETUP.md) for prerequisites, PostgreSQL setup, environment configuration, and example queries. When cloning this repository, skip the archive packaging and extraction steps:

```bash
git clone https://github.com/manueltabas/fashion-seminar-demo.git
cd fashion-seminar-demo
```

Configure a dedicated `fashion_seminar_demo` database and your own `.env`, then run:

```bash
./init.sh
npm run dev -- --port 3001
```

Saved reports are stored in the local PostgreSQL database and are not included in Git. API keys and local configuration belong in the ignored `.env` file.

## Sync changes to GitHub

From this project folder:

```bash
git status
git add <files-you-changed>
git commit -m "Describe the change"
git push
```

For a pull request, create a branch before editing, then push it:

```bash
git switch -c my-change
# Edit, verify, and commit your changes.
git push -u origin my-change
gh pr create
```

You can also ask Codex to commit and push changes or create a pull request while working in this folder. Sync happens when you commit and push.

## Project guidance

- [SEMINAR-DEMO.md](SEMINAR-DEMO.md): scope and limitations.
- [PROGRESS.md](PROGRESS.md): verification history.
- [AGENTS.md](AGENTS.md): instructions for coding agents.
