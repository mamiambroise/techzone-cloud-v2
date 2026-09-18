# Techzone ERP — environnement de développement local

Cet environnement exécute Dolibarr 23.0.3 exclusivement sur la boucle locale :

- interface avec auto-refresh : <http://127.0.0.1:3000>
- serveur PHP direct : <http://127.0.0.1:8080>
- MariaDB dédiée : `127.0.0.1:3307`

Il n'utilise ni Apache, ni Nginx, ni Docker, et n'interfère pas avec les
instances PostgreSQL de la machine.

## Première installation

```bash
./dev-server.sh setup
./dev-server.sh on
```

Le bootstrap installe les paquets système nécessaires avec `sudo`, initialise
une base MariaDB isolée, installe Dolibarr par ses scripts officiels et crée le
superadmin `superadmin`.

Les identifiants générés se trouvent dans `.dev/credentials.env`. Ce fichier
est en mode `600`, appartient à l'utilisateur courant et est ignoré par Git :

```bash
sed -n 's/^DOLIBARR_ADMIN_/DOLIBARR_ADMIN_/p' .dev/credentials.env
```

Ne copiez jamais ce fichier dans le dépôt, un ticket ou un journal.

## Commandes quotidiennes

```bash
./dev-server.sh on
./dev-server.sh status
./dev-server.sh restart
./dev-server.sh logs
./dev-server.sh off
```

`on` et `off` sont idempotentes. Les données persistent sous `.dev/mysql` et
`documents/` entre deux démarrages. Aucune commande de réinitialisation
destructive n'est fournie.

Pour cibler un journal :

```bash
./dev-server.sh logs db
./dev-server.sh logs php
./dev-server.sh logs reload
./dev-server.sh logs install
```

## Rechargement automatique

BrowserSync recharge la page quand un fichier PHP, JavaScript, CSS, HTML ou TPL
change sous `htdocs/`. Les dépendances embarquées dans `htdocs/includes/` sont
exclues afin d'éviter plusieurs milliers de watchers inutiles.

Le port 3000 est l'URL canonique de cette installation. Utiliser directement le
port 8080 est utile pour diagnostiquer PHP, mais contourne l'auto-refresh.

## Diagnostic

```bash
./dev-server.sh status
ss -ltn | grep -E ':(3000|3307|8080)\b'
php -m
```

Si un port est déjà occupé par un processus extérieur au projet, le script
refuse de le tuer et indique explicitement le conflit. Les PID ne sont utilisés
qu'après vérification de la ligne de commande du processus.
