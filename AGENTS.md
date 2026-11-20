<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git branching workflow (mandatory)

GPMS is a live production app. All work follows a three-level branch hierarchy:

```
experiment/feature branches  →  dev  →  main
   (build & test the idea)     (test together)  (production)
```

1. **`main`: production.** This is what users see. Never commit or push directly to `main`. It only receives merges from `dev`, after `dev` is fully tested.
2. **`dev`: integration and testing.** Finished work from experiment/feature branches is merged here and tested properly, by the owner and possibly real users, before going to `main`. Don't build features directly on `dev`.
3. **Experiment/feature branches.** All new work happens here: a UI/UX overhaul, trying a different database, a new feature, a risky refactor. Create them **from the latest `dev`**, with one branch per idea. Suggested names: `feature/<name>`, `experiment/<name>`, `fix/<name>`.

## Flow for any new work
1. `git checkout dev && git pull` to start from the latest `dev`.
2. `git checkout -b feature/<name>` (or `experiment/…`, `fix/…`).
3. Build, experiment, and test on that branch.
4. When it works, merge it into `dev`, then test again on `dev`.
5. Only when `dev` is confirmed working, merge `dev` into `main`.

## Rules for AI assistants (Claude Code etc.)
- At the start of any coding task, check the current branch. If it is `main` or `dev`, don't start work there. Propose a new branch off the latest `dev` and create it once the owner agrees.
- Never commit or push to `main`, and never merge into `main` or `dev`, without the owner's explicit go-ahead in that session.
- Before merging `dev` into `main`, confirm with the owner that `dev` has been tested.
- If an urgent production fix seems to need a different path, ask the owner; don't bypass this flow on your own.
