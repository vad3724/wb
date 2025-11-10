# Сервис тарифов коробов WB

Сервис выполняет две задачи:
- Ежечасно получает тарифы коробов Wildberries и сохраняет дневной срез в PostgreSQL.
- Регулярно экспортирует актуальные тарифы в одно или несколько Google‑таблиц (лист `stocks_coefs`), отсортированные по коэффициенту по возрастанию.

## Стек
- Node.js + TypeScript
- PostgreSQL + Knex
- node-cron
- Google Sheets API (Service Account)
- Docker + docker-compose

## Запуск (одной командой)

Требования: установлен Docker и Docker Compose.

1) Создайте файл `.env` из шаблона `env.example` и при необходимости заполните параметры Google (для выгрузки в таблицы) и токен WB:

```bash
cp env.example .env
# Затем отредактируйте .env: установите GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY, G_SHEETS_IDS (при необходимости)
# и WB_API_TOKEN, если на WB требуется авторизация по токену
```

2) Запустите сервис:

```bash
docker compose up --build
```

Будут подняты:
- `db` (Postgres 15) с пользователем/паролем/БД: `postgres`.
- `app` — Node‑сервис, который ждёт БД, применяет миграции, планирует задачи и отдаёт health‑статус на порту `3000`.

## Конфигурация

Переменные окружения (см. `env.example`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — дефолты заданы в compose (все `postgres`).
- `WB_BOX_TARIFFS_ENDPOINT` — эндпоинт WB для тарифов коробов (по умолчанию URL из задания).
- `WB_API_TOKEN` — токен авторизации WB (если требуется).
- `WB_AUTH_HEADER` — имя заголовка для токена (по умолчанию `Authorization`).
- `WB_AUTH_SCHEME` — схема префикса (по умолчанию `Bearer`; оставьте пустым, чтобы отправлять «сырой» токен).
- `G_SHEETS_IDS` — список ID Google‑таблиц через запятую.
- `G_SHEETS_TAB` — имя листа (по умолчанию `stocks_coefs`).
- `GOOGLE_SA_EMAIL` — email сервисного аккаунта Google.
- `GOOGLE_SA_PRIVATE_KEY` — приватный ключ сервисного аккаунта (переводы строк экранируются как `\\n` в `.env`).

Важно: предоставьте сервисному аккаунту права редактирования для каждой целевой таблицы.


## Расписание задач
- Получение тарифов WB: каждые 5 минут.
- Экспорт в Google Sheets: ежечасно в 10 минут (пропускается, если `G_SHEETS_IDS` пуст или не заданы креды Google).

## Проверка работоспособности
- Health: `http://localhost:3000` → `{ "status": "ok" }`.
- БД: подключение к `localhost:5432` (пользователь/пароль/БД `postgres`). Проверьте таблицы `box_tariffs_daily` и `box_tariffs_rows`.
- Google Sheets: откройте указанные таблицы, лист `stocks_coefs`, убедитесь, что строки отсортированы по `coefficient` по возрастанию.

## Разработка
- Локально (опционально): `npm i && npm run dev` (нужна локальная БД и `.env`).
- Миграции: `npm run migrate:latest`.
