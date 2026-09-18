#!/usr/bin/env bash

#Commande:
# ./dev-server.sh on
# ./dev-server.sh status
# ./dev-server.sh restart
# ./dev-server.sh off

#default values for the Dolibarr demo environment qui se trouve dans le répertoire .dev/credentials.env
# DOLIBARR_ADMIN_LOGIN=superadmin
# DOLIBARR_ADMIN_PASSWORD=1d53245e439ab0654fd9016c267992f8f5c9ba71dc6959b4
# DOLIBARR_DB_NAME=techzone_erp
# DOLIBARR_DB_USER=techzone_erp
# DOLIBARR_DB_PASSWORD=542df4f7363f2eb2033738942f7d0827ddd4abb5d9cf01d2

set -Eeuo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$ROOT_DIR/.dev"
RUN_DIR="$DEV_DIR/run"
LOG_DIR="$DEV_DIR/logs"
DB_DATA_DIR="$DEV_DIR/mysql"
DB_CONFIG="$DEV_DIR/mariadb.cnf"
DB_SOCKET="$RUN_DIR/mariadb.sock"
DB_PID_FILE="$RUN_DIR/mariadb.pid"
PHP_PID_FILE="$RUN_DIR/php.pid"
RELOAD_PID_FILE="$RUN_DIR/browser-sync.pid"
CREDENTIALS_FILE="$DEV_DIR/credentials.env"
INSTALL_MARKER="$DEV_DIR/installation.complete"

DB_HOST="127.0.0.1"
DB_PORT="3307"
PHP_HOST="127.0.0.1"
PHP_PORT="8080"
RELOAD_HOST="127.0.0.1"
RELOAD_PORT="3000"

log() {
	printf '[techzone-erp] %s\n' "$*"
}

fail() {
	printf '[techzone-erp] ERREUR: %s\n' "$*" >&2
	exit 1
}

prepare_runtime_dirs() {
	umask 077
	mkdir -p "$DEV_DIR" "$RUN_DIR" "$LOG_DIR"
	chmod 700 "$DEV_DIR" "$RUN_DIR" "$LOG_DIR"
}

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

install_system_dependencies() {
	local packages=(
		curl
		iproute2
		openssl
		php-cli
		php-curl
		php-gd
		php-intl
		php-mbstring
		php-mysql
		php-soap
		php-xml
		php-zip
		mariadb-client
		mariadb-server
	)
	local missing_packages=()
	local package_name

	for package_name in "${packages[@]}"; do
		if ! dpkg-query -W -f='${Status}' "$package_name" 2>/dev/null |
			grep -Fxq 'install ok installed'; then
			missing_packages+=("$package_name")
		fi
	done

	if ((${#missing_packages[@]} == 0)); then
		log "Les dépendances système sont déjà présentes."
		return
	fi

	log "Installation des paquets manquants: ${missing_packages[*]}"
	sudo apt-get update
	sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y "${missing_packages[@]}"

	# The project uses its own user-owned MariaDB instance, never the global service.
	sudo systemctl disable --now mariadb >/dev/null 2>&1 || true
}

verify_prerequisites() {
	local required=(curl openssl php mariadb mariadb-admin mariadb-install-db mariadbd node npm ss)
	local missing=()
	local command_name

	for command_name in "${required[@]}"; do
		if ! command_exists "$command_name"; then
			missing+=("$command_name")
		fi
	done

	if ((${#missing[@]} > 0)); then
		fail "Dépendances manquantes: ${missing[*]}. Exécutez ./dev-server.sh setup."
	fi

	local required_extensions=(curl gd intl mbstring mysqli soap xml zip)
	local extension
	for extension in "${required_extensions[@]}"; do
		if ! php -m | grep -Fxq "$extension"; then
			fail "Extension PHP manquante: $extension"
		fi
	done
}

install_node_dependencies() {
	log "Installation reproductible de BrowserSync..."
	(
		cd "$ROOT_DIR"
		npm ci --no-audit --no-fund
	)
}

generate_credentials() {
	if [[ -f "$CREDENTIALS_FILE" ]]; then
		chmod 600 "$CREDENTIALS_FILE"
		return
	fi

	umask 077
	{
		printf 'DOLIBARR_ADMIN_LOGIN=superadmin\n'
		printf 'DOLIBARR_ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 24)"
		printf 'DOLIBARR_DB_NAME=techzone_erp\n'
		printf 'DOLIBARR_DB_USER=techzone_erp\n'
		printf 'DOLIBARR_DB_PASSWORD=%s\n' "$(openssl rand -hex 24)"
	} >"$CREDENTIALS_FILE"
	chmod 600 "$CREDENTIALS_FILE"
	log "Identifiants générés dans $CREDENTIALS_FILE"
}

load_credentials() {
	[[ -f "$CREDENTIALS_FILE" ]] || fail "Identifiants absents. Exécutez ./dev-server.sh setup."

	# Values are generated as alphanumeric/hex strings and are safe to source locally.
	set -a
	# shellcheck disable=SC1090
	source "$CREDENTIALS_FILE"
	set +a

	: "${DOLIBARR_ADMIN_LOGIN:?}"
	: "${DOLIBARR_ADMIN_PASSWORD:?}"
	: "${DOLIBARR_DB_NAME:?}"
	: "${DOLIBARR_DB_USER:?}"
	: "${DOLIBARR_DB_PASSWORD:?}"
}

write_database_config() {
	umask 077
	{
		printf '[mariadbd]\n'
		printf 'datadir=%s\n' "$DB_DATA_DIR"
		printf 'socket=%s\n' "$DB_SOCKET"
		printf 'pid-file=%s\n' "$DB_PID_FILE"
		printf 'log-error=%s\n' "$LOG_DIR/mariadb.log"
		printf 'bind-address=%s\n' "$DB_HOST"
		printf 'port=%s\n' "$DB_PORT"
		printf 'skip-name-resolve\n'
		printf 'skip-log-bin\n'
		printf 'character-set-server=utf8mb4\n'
		printf 'collation-server=utf8mb4_unicode_ci\n'
		printf '\n[client]\n'
		printf 'socket=%s\n' "$DB_SOCKET"
		printf 'port=%s\n' "$DB_PORT"
	} >"$DB_CONFIG"
	chmod 600 "$DB_CONFIG"
}

initialize_database_datadir() {
	if [[ -d "$DB_DATA_DIR/mysql" ]]; then
		return
	fi

	log "Initialisation de l'instance MariaDB isolée..."
	mkdir -p "$DB_DATA_DIR"
	chmod 700 "$DB_DATA_DIR"
	# Ignore incomplete/global MariaDB configuration and use only project paths.
	mariadb-install-db --no-defaults \
		--datadir="$DB_DATA_DIR" \
		--auth-root-authentication-method=socket \
		--auth-root-socket-user="$(id -un)" \
		--skip-test-db \
		>"$LOG_DIR/mariadb-install.log" 2>&1
}

read_live_pid() {
	local pid_file="$1"
	local pid

	[[ -f "$pid_file" ]] || return 1
	pid="$(<"$pid_file")"
	[[ "$pid" =~ ^[0-9]+$ ]] || return 1
	kill -0 "$pid" 2>/dev/null || return 1
	printf '%s\n' "$pid"
}

pid_belongs_to_project() {
	local pid="$1"
	local expected="$2"
	local command_line

	[[ -r "/proc/$pid/cmdline" ]] || return 1
	command_line="$(tr '\0' ' ' <"/proc/$pid/cmdline")"
	[[ "$command_line" == *"$expected"* ]]
}

remove_stale_pid_file() {
	local pid_file="$1"
	if [[ -f "$pid_file" ]] && ! read_live_pid "$pid_file" >/dev/null; then
		unlink "$pid_file"
	fi
}

port_is_listening() {
	local port="$1"
	ss -ltnH "sport = :$port" 2>/dev/null | grep -q .
}

wait_for_port() {
	local port="$1"
	local label="$2"
	local attempts=60

	while ((attempts-- > 0)); do
		if port_is_listening "$port"; then
			return
		fi
		sleep 0.25
	done

	fail "$label n'écoute pas sur le port $port. Consultez ./dev-server.sh logs."
}

database_is_ready() {
	mariadb-admin --no-defaults --protocol=socket --socket="$DB_SOCKET" ping >/dev/null 2>&1
}

start_database() {
	local pid

	if database_is_ready; then
		log "MariaDB est déjà active sur $DB_HOST:$DB_PORT."
		return
	fi

	remove_stale_pid_file "$DB_PID_FILE"
	if port_is_listening "$DB_PORT"; then
		fail "Le port $DB_PORT est occupé par un processus extérieur au projet."
	fi

	log "Démarrage de MariaDB sur $DB_HOST:$DB_PORT..."
	nohup mariadbd --defaults-file="$DB_CONFIG" \
		>>"$LOG_DIR/mariadb-startup.log" 2>&1 &
	pid="$!"

	for _ in {1..80}; do
		if database_is_ready; then
			pid="$(read_live_pid "$DB_PID_FILE")"
			pid_belongs_to_project "$pid" "$DB_CONFIG" ||
				fail "Le PID MariaDB ne correspond pas à cette instance."
			return
		fi
		kill -0 "$pid" 2>/dev/null ||
			fail "MariaDB s'est arrêtée. Consultez $LOG_DIR/mariadb.log."
		sleep 0.25
	done

	fail "MariaDB n'est pas devenue disponible."
}

create_application_database() {
	log "Création/vérification de la base et de son utilisateur dédié..."
	mariadb --no-defaults --protocol=socket --socket="$DB_SOCKET" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DOLIBARR_DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DOLIBARR_DB_USER}'@'127.0.0.1'
  IDENTIFIED BY '${DOLIBARR_DB_PASSWORD}';
ALTER USER '${DOLIBARR_DB_USER}'@'127.0.0.1'
  IDENTIFIED BY '${DOLIBARR_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DOLIBARR_DB_NAME}\`.* TO
  '${DOLIBARR_DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
}

run_dolibarr_installer() {
	local conf_file="$ROOT_DIR/htdocs/conf/conf.php"
	local data_dir="$ROOT_DIR/documents"
	local install_log="$LOG_DIR/dolibarr-install.log"

	if [[ -f "$INSTALL_MARKER" && -f "$data_dir/install.lock" && -s "$conf_file" ]]; then
		log "Dolibarr est déjà installé ; aucune donnée n'est réinitialisée."
		return
	fi

	if [[ -s "$conf_file" || -f "$data_dir/install.lock" ]]; then
		fail "Installation Dolibarr partielle détectée. Consultez $install_log avant toute intervention."
	fi

	log "Installation de Dolibarr 23.0.3 et création du superadmin..."
	mkdir -p "$data_dir"
	: >"$conf_file"
	chmod 600 "$conf_file"

	{
		# Dolibarr's installer resolves several includes relative to this directory.
		cd "$ROOT_DIR/htdocs/install"
		php step1.php \
			set fr_FR \
			"$ROOT_DIR/htdocs" \
			"$data_dir" \
			"http://$RELOAD_HOST:$RELOAD_PORT" \
			"" "" \
			mysqli "$DB_HOST" \
			"$DOLIBARR_DB_NAME" \
			"$DOLIBARR_DB_USER" \
			"$DOLIBARR_DB_PASSWORD" \
			"$DB_PORT" llx_ 0 0
		php step2.php set fr_FR
		php step5.php \
			"" "" fr_FR set \
			"$DOLIBARR_ADMIN_LOGIN" \
			"$DOLIBARR_ADMIN_PASSWORD" \
			"$DOLIBARR_ADMIN_PASSWORD" \
			440
	} >"$install_log" 2>&1

	chmod 600 "$conf_file"
	[[ -f "$data_dir/install.lock" ]] ||
		fail "Le verrou d'installation Dolibarr n'a pas été créé."
	printf 'Dolibarr 23.0.3 installed locally\n' >"$INSTALL_MARKER"
	chmod 600 "$INSTALL_MARKER"
}

verify_dolibarr_database() {
	local result

	result="$(
		MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
			--protocol=tcp \
			--host="$DB_HOST" \
			--port="$DB_PORT" \
			--user="$DOLIBARR_DB_USER" \
			--batch --skip-column-names \
			"$DOLIBARR_DB_NAME" \
			-e "SELECT CONCAT(login, ':', admin, ':', entity, ':', statut)
			    FROM llx_user
			    WHERE login = 'superadmin';"
	)"
	[[ "$result" == "superadmin:1:0:1" ]] ||
		fail "Le compte superadmin global n'a pas été validé en base."

	local table_count
	table_count="$(
		MYSQL_PWD="$DOLIBARR_DB_PASSWORD" mariadb --no-defaults \
			--protocol=tcp \
			--host="$DB_HOST" \
			--port="$DB_PORT" \
			--user="$DOLIBARR_DB_USER" \
			--batch --skip-column-names \
			"$DOLIBARR_DB_NAME" \
			-e "SELECT COUNT(*) FROM information_schema.tables
			    WHERE table_schema = '${DOLIBARR_DB_NAME}';"
	)"
	[[ "$table_count" =~ ^[0-9]+$ ]] && ((table_count > 100)) ||
		fail "Le schéma Dolibarr semble incomplet ($table_count tables)."
	log "Base validée : $table_count tables et superadmin global actif."
}

start_php() {
	local pid

	if pid="$(read_live_pid "$PHP_PID_FILE")" &&
		pid_belongs_to_project "$pid" "$ROOT_DIR/htdocs"; then
		log "PHP est déjà actif sur $PHP_HOST:$PHP_PORT."
		return
	fi

	remove_stale_pid_file "$PHP_PID_FILE"
	if port_is_listening "$PHP_PORT"; then
		fail "Le port $PHP_PORT est occupé par un processus extérieur au projet."
	fi

	log "Démarrage de PHP sur $PHP_HOST:$PHP_PORT..."
	nohup php \
		-d display_errors=1 \
		-d error_reporting=E_ALL \
		-S "$PHP_HOST:$PHP_PORT" \
		-t "$ROOT_DIR/htdocs" \
		>"$LOG_DIR/php.log" 2>&1 &
	printf '%s\n' "$!" >"$PHP_PID_FILE"
	wait_for_port "$PHP_PORT" "PHP"
}

start_browser_sync() {
	local pid
	local executable="$ROOT_DIR/node_modules/.bin/browser-sync"

	[[ -x "$executable" ]] ||
		fail "BrowserSync absent. Exécutez ./dev-server.sh setup."

	if pid="$(read_live_pid "$RELOAD_PID_FILE")" &&
		pid_belongs_to_project "$pid" "$ROOT_DIR/bs-config.cjs"; then
		log "BrowserSync est déjà actif sur $RELOAD_HOST:$RELOAD_PORT."
		return
	fi

	remove_stale_pid_file "$RELOAD_PID_FILE"
	if port_is_listening "$RELOAD_PORT"; then
		fail "Le port $RELOAD_PORT est occupé par un processus extérieur au projet."
	fi

	log "Démarrage de BrowserSync sur $RELOAD_HOST:$RELOAD_PORT..."
	nohup "$executable" start --config "$ROOT_DIR/bs-config.cjs" \
		>"$LOG_DIR/browser-sync.log" 2>&1 &
	printf '%s\n' "$!" >"$RELOAD_PID_FILE"
	wait_for_port "$RELOAD_PORT" "BrowserSync"
}

stop_managed_process() {
	local label="$1"
	local pid_file="$2"
	local expected="$3"
	local pid

	if ! pid="$(read_live_pid "$pid_file")"; then
		remove_stale_pid_file "$pid_file"
		log "$label est déjà arrêté."
		return
	fi

	pid_belongs_to_project "$pid" "$expected" ||
		fail "Refus d'arrêter le PID $pid : il n'appartient pas à $label dans ce projet."

	kill "$pid"
	for _ in {1..40}; do
		if ! kill -0 "$pid" 2>/dev/null; then
			unlink "$pid_file" 2>/dev/null || true
			log "$label arrêté."
			return
		fi
		sleep 0.25
	done

	kill -KILL "$pid"
	unlink "$pid_file" 2>/dev/null || true
	log "$label arrêté de force après expiration du délai."
}

stop_database() {
	local pid

	if ! database_is_ready; then
		remove_stale_pid_file "$DB_PID_FILE"
		log "MariaDB est déjà arrêtée."
		return
	fi

	pid="$(read_live_pid "$DB_PID_FILE")" ||
		fail "MariaDB répond, mais son PID vérifiable est absent."
	pid_belongs_to_project "$pid" "$DB_CONFIG" ||
		fail "Refus d'arrêter MariaDB : le PID ne correspond pas à cette instance."

	log "Arrêt propre de MariaDB..."
	mariadb-admin --no-defaults --protocol=socket --socket="$DB_SOCKET" shutdown

	for _ in {1..40}; do
		if ! kill -0 "$pid" 2>/dev/null; then
			unlink "$DB_PID_FILE" 2>/dev/null || true
			log "MariaDB arrêtée."
			return
		fi
		sleep 0.25
	done

	fail "MariaDB n'a pas terminé dans le délai attendu."
}

setup_environment() {
	local database_was_running=0

	prepare_runtime_dirs
	install_system_dependencies
	verify_prerequisites
	install_node_dependencies
	generate_credentials
	load_credentials
	write_database_config
	initialize_database_datadir

	if database_is_ready; then
		database_was_running=1
	fi
	start_database
	create_application_database
	run_dolibarr_installer
	verify_dolibarr_database

	if ((database_was_running == 0)); then
		stop_database
	fi

	log "Installation terminée."
	log "Superadmin: $DOLIBARR_ADMIN_LOGIN"
	log "Identifiants: $CREDENTIALS_FILE"
	log "Démarrage: ./dev-server.sh on"
}

start_environment() {
	prepare_runtime_dirs
	verify_prerequisites
	[[ -f "$INSTALL_MARKER" ]] ||
		fail "Dolibarr n'est pas installé. Exécutez ./dev-server.sh setup."
	load_credentials
	write_database_config
	start_database
	verify_dolibarr_database
	start_php
	start_browser_sync

	curl --fail --silent --show-error \
		"http://$RELOAD_HOST:$RELOAD_PORT/" >/dev/null
	log "Dolibarr est disponible sur http://$RELOAD_HOST:$RELOAD_PORT"
}

stop_environment() {
	prepare_runtime_dirs
	stop_managed_process "BrowserSync" "$RELOAD_PID_FILE" "$ROOT_DIR/bs-config.cjs"
	stop_managed_process "PHP" "$PHP_PID_FILE" "$ROOT_DIR/htdocs"
	stop_database
}

print_process_status() {
	local label="$1"
	local pid_file="$2"
	local expected="$3"
	local endpoint="$4"
	local pid

	if pid="$(read_live_pid "$pid_file")" && pid_belongs_to_project "$pid" "$expected"; then
		printf '%-12s ACTIF   pid=%s  %s\n' "$label" "$pid" "$endpoint"
	else
		printf '%-12s ARRÊTÉ  %s\n' "$label" "$endpoint"
	fi
}

show_status() {
	prepare_runtime_dirs
	print_process_status "MariaDB" "$DB_PID_FILE" "$DB_CONFIG" "$DB_HOST:$DB_PORT"
	print_process_status "PHP" "$PHP_PID_FILE" "$ROOT_DIR/htdocs" "http://$PHP_HOST:$PHP_PORT"
	print_process_status "BrowserSync" "$RELOAD_PID_FILE" "$ROOT_DIR/bs-config.cjs" "http://$RELOAD_HOST:$RELOAD_PORT"

	if [[ -f "$INSTALL_MARKER" ]]; then
		printf '%-12s OUI\n' "Installé"
	else
		printf '%-12s NON\n' "Installé"
	fi
}

show_logs() {
	prepare_runtime_dirs
	local selection="${1:-all}"
	local files=()

	case "$selection" in
		db)
			files=("$LOG_DIR/mariadb.log" "$LOG_DIR/mariadb-startup.log")
			;;
		php)
			files=("$LOG_DIR/php.log")
			;;
		reload)
			files=("$LOG_DIR/browser-sync.log")
			;;
		install)
			files=("$LOG_DIR/dolibarr-install.log" "$LOG_DIR/mariadb-install.log")
			;;
		all)
			files=(
				"$LOG_DIR/mariadb.log"
				"$LOG_DIR/php.log"
				"$LOG_DIR/browser-sync.log"
			)
			;;
		*)
			fail "Journal inconnu: $selection (db, php, reload, install ou all)."
			;;
	esac

	local existing=()
	local file
	for file in "${files[@]}"; do
		[[ -f "$file" ]] && existing+=("$file")
	done
	((${#existing[@]} > 0)) || fail "Aucun journal disponible pour '$selection'."

	tail -n 100 -F "${existing[@]}"
}

usage() {
	cat <<'EOF'
Usage: ./dev-server.sh COMMAND

Commandes:
  setup            Installe et initialise l'environnement local
  on               Démarre MariaDB, PHP et BrowserSync
  off              Arrête proprement les trois services
  restart          Redémarre les trois services
  status           Affiche l'état et les URLs
  logs [service]   Suit les logs (all, db, php, reload, install)
EOF
}

main() {
	case "${1:-}" in
		setup)
			setup_environment
			;;
		on)
			start_environment
			;;
		off)
			stop_environment
			;;
		restart)
			stop_environment
			start_environment
			;;
		status)
			show_status
			;;
		logs)
			show_logs "${2:-all}"
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
