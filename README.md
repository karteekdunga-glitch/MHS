# MHS

## Automatic deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`.

The server deploy runs these commands in order:

```bash
cd ~/MHS
git pull origin main
npm ci
npm run build
pm2 reload mhs-app --update-env
```

Required GitHub Actions secrets:

- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY`
- `SSH_PORT`
