import './utils/env.js';
import { scheduleJobs } from './jobs/scheduler.js';
import { getKnex } from './db/knex.js';
import http, { IncomingMessage, ServerResponse } from 'http';

async function bootstrap() {
	// Поднимаем соединение с БД заранее
	const knex = getKnex();
	await knex.raw('select 1');

	// Планировщик периодических задач (cron)
	scheduleJobs();

	// Простой healthcheck HTTP-сервер
	const port = Number(process.env.PORT || 3000);
	http
		.createServer((_: IncomingMessage, res: ServerResponse) => {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok' }));
		})
		.listen(port, () => console.log(`Сервис запущен на :${port}`));
}

try {
	await bootstrap();
} catch (err) {
	console.error('Fatal error during bootstrap', err);
	process.exit(1);
}


