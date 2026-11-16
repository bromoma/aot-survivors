# Contributing

Thanks for helping! The `main` branch is protected: it is what the live site is built from, so every change goes through a pull request and is merged only after **@bromoma** approves it.

## Workflow

1. Get the latest code:
   ```bash
   git checkout main
   git pull
   ```
2. Create a branch for your change:
   ```bash
   git checkout -b my-change
   ```
3. Make the change and test it locally (`node dev/serve.js`, then http://localhost:5520/).
4. Commit and push your branch:
   ```bash
   git add -A
   git commit -m "Short description of the change"
   git push -u origin my-change
   ```
5. Open a pull request on GitHub (`main` ← `my-change`) and describe what you changed and how you tested it. Screenshots help a lot.
6. Wait for the review. If changes are requested, commit them to the same branch — the pull request updates by itself (a new push needs a new approval).

## Before opening a pull request

- The game loads without errors in the browser console.
- New texts are in English, wrapped in `tr()`, and have a row in `src/i18n.js` with Spanish and Russian (see the README).
- New sprites are packed with `node dev/pack.js`.
- One pull request = one topic. Smaller pull requests are reviewed faster.
