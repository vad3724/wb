import cron from 'node-cron';
import { fetchBoxTariffs, upsertTodaySnapshot } from '../services/wb.js';
import { exportLatestToSheets } from '../services/sheets.js';

export function scheduleJobs(): void {
	// Ежечасно в 05 минут — получение тарифов WB
	cron.schedule('5 * * * *', async () => {
		console.log('[CRON] Забираем тарифы коробов WB');
		try {
			const data = await fetchBoxTariffs();
			await upsertTodaySnapshot(data);
			console.log('[CRON] Тарифы сохранены в БД (срез за сегодня)');
		} catch (e) {
			console.error('[CRON] Ошибка при запросе тарифов WB', e);
		}
	});

	// Ежечасно в 10 минут — экспорт в Google Sheets
	cron.schedule('6 * * * *', async () => {
		console.log('[CRON] Обновляем Google Sheets');
		try {
			await exportLatestToSheets();
			console.log('[CRON] Данные выгружены в Google Sheets');
		} catch (e) {
			console.error('[CRON] Ошибка при выгрузке в Google Sheets', e);
		}
	});
}


