#!/bin/sh
set -e

echo "Ждём базу данных на $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
	echo "База недоступна, пробуем снова..."
	sleep 1
done

echo "Применяем миграции..."
npx knex --knexfile knexfile.cjs migrate:latest

exec "$@"


