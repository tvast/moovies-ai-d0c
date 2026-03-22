# FILM-IA — Moovies Platform

> Plateforme de production vidéo par IA — fondée par d0c

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                          │
├───────────────┬──────────────────┬──────────────────────────────┤
│   VPS Debian  │   Google Cloud   │       Domaines              │
│ 51.254.139.35 │   Run (europe)   │                             │
├───────────────┴──────────────────┴──────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  4uth    │  │ moovies-rest │  │    quasar-moovies         │ │
│  │ Symfony  │  │  Cloud Run   │  │    Vue 3 / Quasar         │ │
│  │ Auth API │  │  REST API    │  │    SPA Frontend           │ │
│  │ :8010    │  │  :8080       │  │    Firebase Hosting       │ │
│  └────┬─────┘  └──────────────┘  └───────────────────────────┘ │
│       │                                                         │
│  ┌────┴─────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ PostgreSQL│  │ moovies-grpc │  │    w4n                    │ │
│  │ db_4uth  │  │  Cloud Run   │  │    Network Monitor        │ │
│  │ :5432    │  │  gRPC API    │  │    tshark + Vue dashboard │ │
│  └──────────┘  └──────────────┘  └───────────────────────────┘ │
│                                                                 │
│  ┌──────────┐                                                   │
│  │ MongoDB  │  Stockage paquets réseau (w4n)                   │
│  │ :27017   │                                                   │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Projets

| Dossier | Stack | Rôle | Déployé sur |
|---|---|---|---|
| `4uth/` | Symfony 7.2 + PostgreSQL 15 | Auth microservice (JWT RS256) | VPS — `auth.keyops.fr` |
| `moovies-gateway/` | NestJS + TypeScript | API REST + gRPC gateway | Cloud Run — `europe-west4` |
| `quasar-moovies/` | Vue 3 + Quasar + Vite | Frontend SPA | Firebase Hosting / `moovies-ai.web.app` |
| `w4n/` | Node.js + Vue 3 + tshark + MongoDB | Monitoring réseau temps réel | VPS — `monitor.keyops.fr` |

## Domaines & URLs

| URL | Service | SSL |
|---|---|---|
| `https://auth.keyops.fr` | 4uth (Symfony auth + backoffice EasyAdmin) | ✅ Let's Encrypt |
| `https://auth.keyops.fr/admin` | Backoffice EasyAdmin | ✅ |
| `https://monitor.keyops.fr` | w4n (dashboard monitoring) | ✅ Let's Encrypt |
| `https://moovies-rest-787293259783.europe-west4.run.app` | Gateway REST | ✅ GCP managed |
| `https://moovies-grpc-787293259783.europe-west4.run.app` | Gateway gRPC | ✅ GCP managed |
| `https://moovies-ai.web.app` | Frontend Quasar | ✅ Firebase |

## VPS Debian — `51.254.139.35`

### Accès SSH

| User | Rôle | sudo | Auth |
|---|---|---|---|
| `d0c` | Admin principal | ✅ full NOPASSWD | Clé SSH |
| `claude` | CI/deploy | ⚠️ restreint (build only) | Clé SSH |
| `debian` | Legacy OVH | ❌ aucun | Clé SSH |
| `root` | Rescue | Locked | Bloqué |

### Services systemd

| Service | Port | Commande |
|---|---|---|
| `php8.3-fpm` | socket | `sudo systemctl restart php8.3-fpm` |
| `nginx` | 80/443 | `sudo systemctl reload nginx` |
| `postgresql` | 5432 | `sudo systemctl status postgresql` |
| `w4n` | 3001 | `sudo systemctl restart w4n` |
| `mongod` | 27017 | `sudo systemctl status mongod` |

### Firewall (UFW)

```
22/tcp    SSH
80/tcp    HTTP
443/tcp   HTTPS
2222/tcp  SSH alt
8001/tcp  Dev
8010/tcp  4uth API
50052/tcp gRPC dev
```

### Sécurité

- **fail2ban** — anti brute-force SSH/nginx
- **UFW** — deny par défaut, ports explicites
- **Lynis** — score 81/100
- **w4n** — monitoring réseau temps réel
- **Cloud Monitoring** — alertes 5xx et latence sur Cloud Run

### Backups

- **Cron quotidien** 3h UTC : `pg_dump db_4uth → gzip → gs://moovies-4uth-backups`
- **Rétention** : 90 jours auto-delete sur GCS
- **Script** : `/usr/local/bin/backup-4uth.sh`
- **Logs** : `/var/log/4uth-backup.log`

---

## 4uth — Auth Microservice

### Stack
- Symfony 7.2 skeleton
- PostgreSQL 15 (VPS) / 16 (dev local)
- Lexik JWT RS256
- EasyAdmin v5 (backoffice)
- NelmiO CORS

### API Routes

```
POST   /api/auth/register    → Créer un compte (public)
POST   /api/auth/login       → Login JSON, retourne JWT (public)
GET    /api/auth/me          → Profil utilisateur (auth)
POST   /api/auth/refresh     → Rotation refresh token (public)
PUT    /api/auth/profile     → Modifier profil (auth)
POST   /api/auth/logout      → Invalider refresh token (auth)
```

### Entities

**User** : id, email (unique), roles (JSON), password, displayName, firstName, lastName, phone, avatarUrl, isActive, createdAt, updatedAt

**RefreshToken** : id, user (FK CASCADE), token (unique 128), expiresAt, createdAt

### JWT Flow

```
Client → POST /login (email+password)
       ← { access_token (JWT RS256, 1h), refresh_token (opaque, 30j) }

Client → GET /api/* + Authorization: Bearer <JWT>
       ← Validated stateless by Symfony

Gateway → Validates JWT with public key only (no network call to 4uth)
```

### Backoffice

- URL : `https://auth.keyops.fr/admin`
- Login avec un compte ROLE_ADMIN
- CRUD Users : créer, éditer, supprimer, changer rôles, activer/désactiver

### Config clés

- `.env.local` : credentials prod (DB, JWT passphrase, CORS)
- `config/jwt/` : RSA keypair (private.pem + public.pem)
- `config/packages/security.yaml` : firewalls (login, api, admin)

---

## w4n — Network Monitor

### Stack
- Backend : Node.js + tshark + WebSocket + MongoDB
- Dashboard : Vue 3 + Vite

### Auth
- Login via 4uth API (email/password)
- Accès ROLE_ADMIN uniquement
- WebSocket protégé par JWT (token en query string)

### Scoring réseau

| Port | Score | Type |
|---|---|---|
| 22 (SSH) | +50 | Scan SSH |
| 23 (Telnet) | +50 | Scan Telnet |
| 445 (SMB) | +50 | Scan SMB |
| 3389 (RDP) | +40 | Scan RDP |
| < 1024 | +10 | Port bas |
| Scanner connu | +20 | Bonus réseau suspect |

- Seuil d'alerte : score ≥ 40
- IP VPS (sortant) : ignoré
- IP whitelistée : ignorée
- Buffer MongoDB : flush toutes les 50 paquets ou 10s

---

## moovies-gateway — API Gateway

### Stack
- NestJS + TypeScript
- REST (port 8080) + gRPC (port 50051)
- Déployé sur Cloud Run (`--use-http2` pour gRPC)

### Déploiement Cloud Run

```bash
gcloud builds submit --tag europe-west4-docker.pkg.dev/moovies-ai/moovies/gateway:latest
gcloud run deploy moovies-rest --image=... --region=europe-west4
gcloud run deploy moovies-grpc --image=... --region=europe-west4 --use-http2
```

---

## quasar-moovies — Frontend

### Stack
- Vue 3 + Quasar Framework + Vite
- Thème dark copper (gradients sombres, accents cuivrés)
- Firebase Hosting

### Auth composables
- `src/composables/useAuth.ts` — auth 4uth (remplace progressivement Firebase)
- `src/lib/auth/api.ts` — HTTP client 4uth

### Pages clés
- `/login` — LoginView
- `/profile` — ProfileView
- `/launch` — FunnelStepper (production vidéo)

---

## Monitoring & Alertes

### VPS (w4n)
- Dashboard temps réel : `https://monitor.keyops.fr`
- Capture tshark sur `ens3`
- Alertes WebSocket pour score ≥ 40

### Cloud Run (GCP)
- **Alerte 5xx** : taux > 0.1/s pendant 1min → email d0c@keyops.fr + theophile.vast@gmail.com
- **Alerte latence** : p95 > 5s pendant 5min → mêmes destinataires
- Console : [Cloud Monitoring](https://console.cloud.google.com/monitoring/alerting?project=moovies-ai)

---

## Commandes utiles

```bash
# SSH VPS
ssh d0c@51.254.139.35

# Logs 4uth
ssh d0c@51.254.139.35 "sudo tail -f /var/log/nginx/4uth_error.log"

# Logs w4n
ssh d0c@51.254.139.35 "sudo journalctl -u w4n -f"

# Backup manuel
ssh d0c@51.254.139.35 "/usr/local/bin/backup-4uth.sh"

# Lister backups
gsutil ls -l gs://moovies-4uth-backups/

# Restaurer backup
gsutil cat gs://moovies-4uth-backups/4uth_XXXX.sql.gz | gunzip | psql db_4uth

# Lynis audit
ssh d0c@51.254.139.35 "sudo lynis audit system"

# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=moovies-rest AND severity>=WARNING" --project=moovies-ai --limit=10
```

## Docs VuePress (privées via 4uth)

- `yarn install` puis `yarn docs:dev` pour lancer la doc en local
- `yarn docs:build` pour générer `/docs/.vuepress/dist`
- Par défaut l'auth pointe vers `https://auth.keyops.fr/api/auth` (override avec `VITE_AUTH_ORIGIN` et `VITE_AUTH_PATH`)

---

## Compte test

```
Email:    test@moovies.app
Password: Test1234
Rôle:     ROLE_ADMIN
```

> ⚠️ Changer ce mot de passe en production
