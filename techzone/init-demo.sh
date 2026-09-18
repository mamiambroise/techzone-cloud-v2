#!/usr/bin/env bash

# Téléchargement et installation de la démo officielle Dolibarr 23.0.3 :
#   ./init-demo.sh check  # Télécharge et vérifie sans installer.
#   ./init-demo.sh        # Demande confirmation, puis installe sans sauvegarde.
#
# Chemins utilisés :
#   Téléchargement : /tmp/dolibarr-official-23.0.3/dev/initdemo
#   Identifiants   : .dev/credentials.env
#   Base MariaDB   : techzone_erp sur 127.0.0.1:3307
#   Documents      : documents/
# DOLIBARR_ADMIN_LOGIN=superadmin
# DOLIBARR_ADMIN_PASSWORD=1d53245e439ab0654fd9016c267992f8f5c9ba71dc6959b4
# DOLIBARR_DB_NAME=techzone_erp
# DOLIBARR_DB_USER=techzone_erp
# DOLIBARR_DB_PASSWORD=542df4f7363f2eb2033738942f7d0827ddd4abb5d9cf01d2





set -Eeuo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CREDENTIALS_FILE="$ROOT_DIR/.dev/credentials.env"
DB_SOCKET="$ROOT_DIR/.dev/run/mariadb.sock"
DB_HOST="127.0.0.1"
DB_PORT="3307"
OFFICIAL_REPOSITORY="https://github.com/Dolibarr/dolibarr.git"
OFFICIAL_TAG="23.0.3"
DEMO_CHECKOUT_DIR="/tmp/dolibarr-official-23.0.3"
DEMO_DIR="$DEMO_CHECKOUT_DIR/dev/initdemo"
DEMO_SQL="$DEMO_DIR/mysqldump_dolibarr_23.0.0.sql"
DEMO_DOCUMENTS="$DEMO_DIR/documents_demo"
UPDATE_SCRIPT_SOURCE="$DEMO_DIR/updatedemo.php"
UPDATE_SCRIPT_TARGET="$ROOT_DIR/dev/initdemo/updatedemo.php"
EXPECTED_DUMP_SHA256="409d91b3439b58f2b825b2c092bec5743528e1b3acb4e4a33d0d99e05f5ec4f5"
EXPECTED_DOLIBARR_VERSION="23.0.3"

log() {
	printf '[dolibarr-demo] %s\n' "$*"
}

fail() {
	printf '[dolibarr-demo] ERREUR: %s\n' "$*" >&2
	exit 1
}

usage() {
	cat <<'EOF'
Usage: ./init-demo.sh check
       ./init-demo.sh

Commandes:
  check    Télécharge et vérifie la démo sans modifier les données locales

Sans commande, le script télécharge la démo, demande une confirmation y/n,
puis efface les données locales et installe la démo officielle.

ATTENTION : aucune sauvegarde n'est créée.

La source de démonstration attendue par défaut est :
  /tmp/dolibarr-official-23.0.3/dev/initdemo
EOF
}

require_command() {
	command -v "$1" >/dev/null 2>&1 ||
		fail "Commande requise introuvable : $1"
}

load_credentials() {
	[[ -f "$CREDENTIALS_FILE" ]] ||
		fail "Identifiants absents : $CREDENTIALS_FILE"

	# Ce fichier est généré localement avec des valeurs alphanumériques sûres.
	set -a
	# shellcheck disable=SC1090
	source "$CREDENTIALS_FILE"
	set +a

	: "${DOLIBARR_ADMIN_LOGIN:?}"
	: "${DOLIBARR_ADMIN_PASSWORD:?}"
	: "${DOLIBARR_DB_NAME:?}"
	: "${DOLIBARR_DB_USER:?}"
	: "${DOLIBARR_DB_PASSWORD:?}"

	# Ces garde-fous empêchent une suppression sur une cible inattendue.
	[[ "$DOLIBARR_DB_NAME" == "techzone_erp" ]] ||
		fail "Base refusée : $DOLIBARR_DB_NAME"
	[[ "$DOLIBARR_DB_USER" == "techzone_erp" ]] ||
		fail "Utilisateur MariaDB refusé : $DOLIBARR_DB_USER"
	[[ "$DOLIBARR_ADMIN_LOGIN" == "superadmin" ]] ||
		fail "Administrateur Dolibarr inattendu : $DOLIBARR_ADMIN_LOGIN"
}

download_demo_source() {
	require_command git

	if [[ ! -d "$DEMO_CHECKOUT_DIR/.git" ]]; then
		[[ ! -e "$DEMO_CHECKOUT_DIR" ]] ||
			fail "$DEMO_CHECKOUT_DIR existe, mais n'est pas un dépôt Git"

		log "Téléchargement de Dolibarr $OFFICIAL_TAG depuis GitHub..."
		git clone \
			--depth 1 \
			--branch "$OFFICIAL_TAG" \
			--filter=blob:none \
			--sparse \
			"$OFFICIAL_REPOSITORY" \
			"$DEMO_CHECKOUT_DIR"
	else
		log "Dépôt officiel déjà présent dans $DEMO_CHECKOUT_DIR."
	fi

	# Ne récupérer que le jeu de données nécessaire à la démonstration.
	git -C "$DEMO_CHECKOUT_DIR" sparse-checkout set dev/initdemo

	[[ "$(git -C "$DEMO_CHECKOUT_DIR" describe --tags --exact-match 2>/dev/null)" == "$OFFICIAL_TAG" ]] ||
		fail "Le dépôt téléchargé n'est pas positionné sur le tag $OFFICIAL_TAG"
}

check_prerequisites() {
	local actual_sha256

	download_demo_source
	require_command mariadb
	require_command php
	require_command sha256sum

	[[ -S "$DB_SOCKET" ]] ||
		fail "MariaDB locale inactive. Exécutez d'abord ./dev-server.sh on"
	[[ -s "$DEMO_SQL" ]] ||
		fail "Dump officiel absent : $DEMO_SQL"
	[[ -d "$DEMO_DOCUMENTS" ]] ||
		fail "Documents de démo absents : $DEMO_DOCUMENTS"
	[[ -s "$UPDATE_SCRIPT_SOURCE" ]] ||
		fail "Script de mise à jour absent : $UPDATE_SCRIPT_SOURCE"
	[[ -d "$ROOT_DIR/documents" ]] ||
		fail "Répertoire Dolibarr absent : $ROOT_DIR/documents"

	actual_sha256="$(sha256sum "$DEMO_SQL" | awk '{print $1}')"
	[[ "$actual_sha256" == "$EXPECTED_DUMP_SHA256" ]] ||
		fail "L'empreinte du dump officiel est incorrecte"

	MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
		--protocol=tcp \
		--host="$DB_HOST" \
		--port="$DB_PORT" \
		--user="$DOLIBARR_DB_USER" \
		--execute="SELECT 1" \
		"$DOLIBARR_DB_NAME" \
		>/dev/null

	log "Prérequis validés pour Dolibarr 23.0.3."
}

confirm_destructive_reset() {
	local answer

	printf '\n'
	printf 'ATTENTION : la base "%s" et tous les documents seront écrasés.\n' \
		"$DOLIBARR_DB_NAME"
	printf 'AUCUNE SAUVEGARDE ne sera créée.\n'
	printf 'Continuer ? [y/N] '

	if [[ ! -t 0 ]]; then
		printf '\n' >&2
		fail "Confirmation interactive impossible"
	fi

	read -r answer
	case "$answer" in
		y | Y | yes | YES | Yes | o | O | oui | OUI | Oui)
			log "Écrasement confirmé."
			;;
		*)
			log "Opération annulée. Aucune donnée n'a été modifiée."
			exit 0
			;;
	esac
}

reset_database() {
	log "Suppression et recréation de la base $DOLIBARR_DB_NAME..."

	# L'instance MariaDB locale authentifie l'utilisateur système par socket.
	mariadb --no-defaults \
		--protocol=socket \
		--socket="$DB_SOCKET" <<SQL
DROP DATABASE IF EXISTS \`techzone_erp\`;
CREATE DATABASE \`techzone_erp\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
SQL

	log "Import du dump officiel..."
	MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
		--protocol=tcp \
		--host="$DB_HOST" \
		--port="$DB_PORT" \
		--user="$DOLIBARR_DB_USER" \
		"$DOLIBARR_DB_NAME" \
		<"$DEMO_SQL"
}

configure_superadmin() {
	local admin_hash

	# Conserver le superadmin attendu par dev-server.sh et ses identifiants locaux.
	admin_hash="$(
		DEMO_ADMIN_PASSWORD="$DOLIBARR_ADMIN_PASSWORD" php -r \
			'echo password_hash(getenv("DEMO_ADMIN_PASSWORD"), PASSWORD_BCRYPT);'
	)"

	MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
		--protocol=tcp \
		--host="$DB_HOST" \
		--port="$DB_PORT" \
		--user="$DOLIBARR_DB_USER" \
		"$DOLIBARR_DB_NAME" \
		--execute="
			UPDATE llx_user
			SET login = 'superadmin',
			    entity = 0,
			    pass = '',
			    pass_crypted = '$admin_hash',
			    admin = 1,
			    statut = 1
			WHERE login = 'admin';
		"
}

finalize_demo_version() {
	local code_version

	# Le dump officiel du tag 23.0.3 reste étiqueté 23.0.0. Sans cette
	# finalisation, Dolibarr redirige chaque requête vers /install/index.php.
	code_version="$(
		ROOT_DIR="$ROOT_DIR" php -r \
			'require getenv("ROOT_DIR")."/htdocs/version.inc.php"; echo DOL_VERSION;'
	)"
	[[ "$code_version" == "$EXPECTED_DOLIBARR_VERSION" ]] ||
		fail "Version du code inattendue : $code_version"

	MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
		--protocol=tcp \
		--host="$DB_HOST" \
		--port="$DB_PORT" \
		--user="$DOLIBARR_DB_USER" \
		"$DOLIBARR_DB_NAME" \
		--execute="
			UPDATE llx_const
			SET value = '$code_version'
			WHERE name = 'MAIN_VERSION_LAST_UPGRADE'
			  AND entity = 0;
		"
}

reset_documents() {
	log "Remplacement des documents locaux par ceux de la démo..."

	# Le périmètre est volontairement limité au répertoire documents du projet.
	find "$ROOT_DIR/documents" \
		-mindepth 1 \
		-maxdepth 1 \
		-exec rm -rf -- {} +

	cp -a "$DEMO_DOCUMENTS/." "$ROOT_DIR/documents/"
	mkdir -p \
		"$ROOT_DIR/documents/doctemplates" \
		"$ROOT_DIR/documents/medias/image"
	cp -a \
		"$ROOT_DIR/htdocs/install/doctemplates/." \
		"$ROOT_DIR/documents/doctemplates/"
	cp -a \
		"$ROOT_DIR/htdocs/install/medias/." \
		"$ROOT_DIR/documents/medias/image/"

	# Empêcher l'assistant d'installation de se rouvrir.
	touch "$ROOT_DIR/documents/install.lock"
	chmod -R u+rwX "$ROOT_DIR/documents"
}

update_demo_dates() {
	log "Actualisation des dates de démonstration..."

	# Ce niveau de répertoire permet au script officiel de trouver htdocs/.
	mkdir -p "$(dirname -- "$UPDATE_SCRIPT_TARGET")"
	[[ ! -e "$UPDATE_SCRIPT_TARGET" ]] ||
		fail "Fichier temporaire déjà présent : $UPDATE_SCRIPT_TARGET"
	cp "$UPDATE_SCRIPT_SOURCE" "$UPDATE_SCRIPT_TARGET"

	if ! php "$UPDATE_SCRIPT_TARGET" confirm; then
		rm -f "$UPDATE_SCRIPT_TARGET"
		fail "Échec de l'actualisation des dates"
	fi

	rm -f "$UPDATE_SCRIPT_TARGET"
	rmdir "$ROOT_DIR/dev/initdemo" "$ROOT_DIR/dev" 2>/dev/null || true
}

verify_demo() {
	local table_count
	local superadmin_state

	table_count="$(
		MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
			--protocol=tcp \
			--host="$DB_HOST" \
			--port="$DB_PORT" \
			--user="$DOLIBARR_DB_USER" \
			--batch --skip-column-names \
			"$DOLIBARR_DB_NAME" \
			--execute="
				SELECT COUNT(*)
				FROM information_schema.tables
				WHERE table_schema = '$DOLIBARR_DB_NAME';
			"
	)"
	[[ "$table_count" == "402" ]] ||
		fail "Nombre de tables inattendu : $table_count"

	superadmin_state="$(
		MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
			--protocol=tcp \
			--host="$DB_HOST" \
			--port="$DB_PORT" \
			--user="$DOLIBARR_DB_USER" \
			--batch --skip-column-names \
			"$DOLIBARR_DB_NAME" \
			--execute="
				SELECT CONCAT(login, ':', admin, ':', entity, ':', statut)
				FROM llx_user
				WHERE login = 'superadmin';
			"
	)"
	[[ "$superadmin_state" == "superadmin:1:0:1" ]] ||
		fail "Le superadmin de démonstration n'est pas valide"

	local database_version
	database_version="$(
		MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
			--protocol=tcp \
			--host="$DB_HOST" \
			--port="$DB_PORT" \
			--user="$DOLIBARR_DB_USER" \
			--batch --skip-column-names \
			"$DOLIBARR_DB_NAME" \
			--execute="
				SELECT value
				FROM llx_const
				WHERE name = 'MAIN_VERSION_LAST_UPGRADE'
				  AND entity = 0;
			"
	)"
	[[ "$database_version" == "$EXPECTED_DOLIBARR_VERSION" ]] ||
		fail "Version de la base inattendue : $database_version"

	log "Base validée : $table_count tables et superadmin actif."
}

initialize_demo() {
	check_prerequisites
	confirm_destructive_reset
	reset_database
	configure_superadmin
	reset_documents
	update_demo_dates
	finalize_demo_version
	verify_demo

	"$ROOT_DIR/dev-server.sh" restart

	curl --fail --silent --show-error \
		"http://127.0.0.1:3000/" \
		>/dev/null

	log "Démo disponible sur http://127.0.0.1:3000"
	log "Connexion : $DOLIBARR_ADMIN_LOGIN"
	log "Mot de passe : valeur DOLIBARR_ADMIN_PASSWORD de .dev/credentials.env"
}

main() {
	load_credentials

	case "${1:-}" in
		check)
			check_prerequisites
			;;
		"")
			initialize_demo
			;;
		-h | --help | help)
			usage
			;;
		*)
			usage >&2
			exit 2
			;;
	esac
}

main "$@"
