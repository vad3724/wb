import { google } from 'googleapis';
import { env } from '../utils/env.js';
import { getKnex } from '../db/knex.js';

function getSheetsClient() {
	if (!env.GOOGLE_SA_EMAIL) {
		throw new Error('GOOGLE_SA_EMAIL не задан');
	}

	if (!env.GOOGLE_SA_PRIVATE_KEY) {
		throw new Error('GOOGLE_SA_PRIVATE_KEY не задан в переменных окружения');
	}

	const privateKey = env.GOOGLE_SA_PRIVATE_KEY.trim();

	// Валидация ключа
	if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
		throw new Error('Ключ должен начинаться с: -----BEGIN PRIVATE KEY-----');
	}

	if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
		throw new Error('Ключ должен заканчиваться на: -----END PRIVATE KEY-----');
	}

	console.log('Private key validation:', {
		startsCorrect: privateKey.startsWith('-----BEGIN PRIVATE KEY-----'),
		endsCorrect: privateKey.endsWith('-----END PRIVATE KEY-----'),
		length: privateKey.length
	});

	const auth = new google.auth.JWT({
		email: env.GOOGLE_SA_EMAIL,
		key: privateKey,
		scopes: ['https://www.googleapis.com/auth/spreadsheets'],
	});

	return google.sheets({
		version: 'v4',
		auth,
		timeout: 30000
	});
}

export async function exportLatestToSheets(): Promise<void> {
	if (env.G_SHEETS_IDS.length === 0) {
		console.log('G_SHEETS_IDS не заданы, пропускаем выгрузку');
		return;
	}

	const knex = getKnex();

	try {
		console.log('Получение данных...');

		// Получаем максимальную дату
		const maxDayResult = await knex('box_tariffs_daily')
			.max('day as max_day')
			.first();

		if (!maxDayResult?.max_day) {
			console.log('Нет данных в box_tariffs_daily');
			return;
		}

		const latest = await knex('box_tariffs_rows')
			.select('*')
			.where('day', maxDayResult.max_day)
			.orderBy([{ column: 'coefficient', order: 'asc' }]);

		console.log(`Найдено ${latest.length} записей за дату ${maxDayResult.max_day}`);

		if (latest.length === 0) {
			console.log('Нет данных для выгрузки');
			return;
		}

		const header = ['day', 'coefficient', 'region', 'warehouse', 'size', 'price'];
		const values: (string | number | null)[][] = [header];

		for (const r of latest) {
			values.push([
				String(r.day),
				r.coefficient !== null ? Number(r.coefficient) : null,
				r.region ?? '',
				r.warehouse ?? '',
				r.size ?? '',
				r.price !== null ? Number(r.price) : null,
			]);
		}

		console.log('Выгрузка в Google Sheets...');
		const sheets = getSheetsClient();

		for (const sheetId of env.G_SHEETS_IDS) {
			console.log(`Выгрузка в таблицу: ${sheetId}`);

			try {
				// Очищаем лист
				await sheets.spreadsheets.values.clear({
					spreadsheetId: sheetId,
					range: `${env.G_SHEETS_TAB}!A:Z`,
				});

				// Записываем данные
				await sheets.spreadsheets.values.update({
					spreadsheetId: sheetId,
					range: `${env.G_SHEETS_TAB}!A1`,
					valueInputOption: 'RAW',
					requestBody: { values },
				});

				console.log(`Успешно выгружено в таблицу ${sheetId}`);

			} catch (sheetError) {
				console.error(`Ошибка при работе с таблицей ${sheetId}:`, sheetError);
				throw sheetError;
			}
		}

		console.log('Выгрузка завершена успешно');

	} catch (error) {
		console.error('Ошибка при выгрузке в Google Sheets:', error);
		throw error;
	}
}