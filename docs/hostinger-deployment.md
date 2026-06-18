# Déploiement Hostinger - LODEN Auto-École

Ce projet est une application full-stack :

- frontend Next.js sur le port `3000` ;
- API Express sur le port `4000` ;
- base PostgreSQL via Prisma ;
- proxy Next.js vers l'API via `LODEN_API_URL`.

## Verdict de déploiement

Le déploiement recommandé sur Hostinger est un VPS Ubuntu avec Node.js, PostgreSQL, PM2, Nginx et Certbot.

Hostinger propose aussi Node.js Web App sur les plans Business Web Hosting et Cloud, mais cette application a deux processus Node distincts. Cette option n'est acceptable que si Hostinger permet de déployer deux apps Node séparées, une pour le frontend Next.js et une pour l'API Express, avec une base PostgreSQL accessible. Pour un lancement aujourd'hui, le VPS est le chemin le plus contrôlable.

Références Hostinger :

- Node.js est disponible via Web/Cloud/VPS selon le niveau de contrôle requis : https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/
- Les plans Business/Cloud supportent les apps Node.js, dont Next.js et Express.js : https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Le déploiement VPS recommandé utilise Git, variables d'environnement, PM2, Nginx et HTTPS : https://www.hostinger.com/au/tutorials/deploy-node-js-application

## Variables à préparer

Créer `.env.production` sur le serveur depuis `.env.production.example`.

Valeurs obligatoires :

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET` avec au moins 32 caractères aléatoires
- `CORS_ORIGIN=https://loden-autoecole.fr,https://www.loden-autoecole.fr`
- `LODEN_API_URL=http://127.0.0.1:4000`
- `API_USE_MEMORY=false`
- `LODEN_ADMIN_EMAIL`
- `LODEN_ADMIN_PASSWORD`

Ne jamais commiter `.env.production`.

## Préparation du VPS

Exemple Ubuntu :

```bash
apt update
apt install -y git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
npm install -g pm2
```

Créer la base :

```bash
sudo -u postgres psql
```

```sql
CREATE USER loden_user WITH PASSWORD 'REMPLACER_PAR_UN_MOT_DE_PASSE_FORT';
CREATE DATABASE loden OWNER loden_user;
GRANT ALL PRIVILEGES ON DATABASE loden TO loden_user;
\q
```

## Installation application

```bash
cd /var/www
git clone REPOSITORY_URL loden-auto-ecole
cd loden-auto-ecole
cp .env.production.example .env.production
nano .env.production
npm ci
```

Charger les variables pour les commandes Prisma/build :

```bash
set -a
. ./.env.production
set +a
```

Initialiser Prisma et compiler :

```bash
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
npm run deploy:build
```

## Démarrage PM2

```bash
set -a
. ./.env.production
set +a
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
pm2 list
```

Contrôles locaux sur le VPS :

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:4000/api/formations
pm2 logs --lines 80
```

## Nginx

Copier la configuration :

```bash
cp deploy/hostinger-nginx.conf /etc/nginx/sites-available/loden-autoecole.fr
ln -s /etc/nginx/sites-available/loden-autoecole.fr /etc/nginx/sites-enabled/loden-autoecole.fr
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

DNS à pointer vers l'IP VPS :

- `A @ -> IP_DU_VPS`
- `A www -> IP_DU_VPS`

HTTPS :

```bash
certbot --nginx -d loden-autoecole.fr -d www.loden-autoecole.fr
```

## Vérification après mise en ligne

Tester :

```bash
curl -I https://loden-autoecole.fr
curl -I https://loden-autoecole.fr/formations
curl -I https://loden-autoecole.fr/contact
curl -I https://loden-autoecole.fr/sitemap.xml
curl https://loden-autoecole.fr/api/formations
```

Parcours manuels :

- page accueil visible ;
- formulaire contact crée une demande ;
- demande CPF crée une demande ;
- connexion admin avec `LODEN_ADMIN_EMAIL` et `LODEN_ADMIN_PASSWORD` ;
- CRM charge les leads, demandes, formations, avis ;
- page `/robots.txt` et `/sitemap.xml` disponibles.

## Commandes de mise à jour

```bash
cd /var/www/loden-auto-ecole
git pull
set -a
. ./.env.production
set +a
npm ci
npm run db:migrate:deploy
npm run deploy:build
pm2 reload ecosystem.config.cjs --env production
pm2 save
```

## Points non couverts par le code

Avant ouverture commerciale réelle :

- renseigner SIRET, forme juridique, hébergeur et numéro d'agrément dans les pages légales ;
- connecter Stripe ou désactiver les parcours paiement réels ;
- connecter l'email transactionnel pour reset password, notifications et confirmations ;
- remplacer les URLs sociales si elles ne sont pas officielles ;
- définir une politique de sauvegarde PostgreSQL quotidienne.
