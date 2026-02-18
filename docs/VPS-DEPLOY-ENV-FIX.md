# VPS deploy and .env fix

## Why "push but nothing happen" or deploy breaks

- If **.env** was ever committed, `git pull` on the VPS can overwrite your VPS `.env` (or cause conflicts).
- The deploy workflow now **ignores** `.env` in the repo and **restores** it on the VPS from a backup (`.env.vps`) after every pull.

## One-time fix on your VPS

SSH into the VPS and run:

```bash
cd /var/www/poetreefrontend/poetree-publication

# 1) If you already have a working .env, save it as the permanent backup
cp .env .env.vps

# 2) If .env is tracked by git, stop tracking it (does not delete the file)
git rm --cached .env 2>/dev/null || true

# 3) Commit the change only if step 2 did something (run on your local machine after pulling)
#    On your LOCAL machine: git pull, then if .env was removed from repo: git add .gitignore && git commit -m "Stop tracking .env" && git push
```

## One-time fix on your local machine (if .env was ever committed)

So that `.env` is never pushed again:

```bash
# Remove .env from git (keeps file on disk)
git rm --cached .env

# Commit and push ( .gitignore already has .env )
git add .gitignore
git commit -m "Stop tracking .env, add .env to .gitignore"
git push origin main
```

After this, **only** `.env.example` is in the repo. Each environment (your PC, VPS) has its own `.env` (and on VPS we keep `.env.vps` as backup for deploy).

## First time deploy on a new VPS

1. Clone the repo, then create `.env` with your real values (e.g. `VITE_API_URL=https://api.poetreepublications.com`).
2. Save a backup so future deploys restore it:
   ```bash
   cp .env .env.vps
   ```
3. Run deploy as usual (e.g. push to `main`). The workflow will restore `.env` from `.env.vps` after every `git pull`.

## What the deploy workflow does now

1. Backs up `.env` → `.env.vps` (if `.env` exists).
2. Runs `git pull origin main` (no `.env` in repo, so no overwrite).
3. Restores `.env` from `.env.vps` so `npm run build` uses your VPS env.
4. If `.env.vps` is missing, copies `.env.example` to `.env` and warns you to add real values and create `.env.vps`.
5. Fails the deploy if `.env` is still missing so you fix it.

## If deploy still "does nothing"

- Check **GitHub Actions**: repo → Actions → "Deploy to VPS" run. See if the job fails and read the log.
- On the VPS, run the deploy steps by hand to see errors:
  ```bash
  cd /var/www/poetreefrontend/poetree-publication
  git pull origin main
  [ -f .env.vps ] && cp .env.vps .env
  npm install
  npm run build
  sudo systemctl reload nginx
  ```
