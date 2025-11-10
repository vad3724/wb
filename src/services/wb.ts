import axios from 'axios';
import { env } from '../utils/env.js';
import { getKnex } from '../db/knex.js';

type UnknownObject = Record<string, unknown>;

export async function fetchBoxTariffs(): Promise<UnknownObject> {
	const headers: Record<string, string> = { Accept: 'application/json' };
	if (env.WB_API_TOKEN) {
		const scheme = env.WB_AUTH_SCHEME?.trim();
		headers[env.WB_AUTH_HEADER] = scheme ? `${scheme} ${env.WB_API_TOKEN}` : env.WB_API_TOKEN;
	}
	const res = await axios.get(env.WB_BOX_TARIFFS_ENDPOINT, {
		headers,
		timeout: 30000,
		params: { date: todayDate() },
	});
	return res.data as UnknownObject;
}

function todayDate(): string {
	const now = new Date();
	return now.toISOString().slice(0, 10);
}

export async function upsertTodaySnapshot(payload: UnknownObject): Promise<void> {
	const knex = getKnex();
	const day = todayDate();
	await knex('box_tariffs_daily')
		.insert({ day, payload })
		.onConflict('day')
		.merge({ payload, updated_at: knex.fn.now() });

	// Пересобрать «плоские» строки на текущий день
	await rebuildFlatRowsForDay(day, payload);
}

function extractRows(payload: UnknownObject): Array<Record<string, unknown>> {
	// Пытаемся найти массивы с данными в типичных полях; иначе оборачиваем весь payload
	const candidates: unknown[] = [];
	if (Array.isArray(payload)) candidates.push(...payload);
	for (const key of Object.keys(payload)) {
		const v = (payload as UnknownObject)[key];
		if (Array.isArray(v)) candidates.push(...v);
	}

	const items = (candidates.length ? candidates : [payload]) as UnknownObject[];
	return items.map((item) => {
		// Название поля коэффициента может отличаться; пробуем распространённые варианты
		const coef =
			(typeof item.coefficient === 'number' && item.coefficient) ||
			(typeof (item as UnknownObject)['coef'] === 'number' && (item as UnknownObject)['coef']) ||
			(typeof (item as UnknownObject)['koef'] === 'number' && (item as UnknownObject)['koef']) ||
			null;

		const region = (item as UnknownObject)['region'] ?? null;
		const warehouse = (item as UnknownObject)['warehouse'] ?? (item as UnknownObject)['warehouseName'] ?? null;
		const size = (item as UnknownObject)['size'] ?? (item as UnknownObject)['boxSize'] ?? null;
		const price = (item as UnknownObject)['price'] ?? null;

		return { coefficient: coef, region, warehouse, size, price, raw: item };
	});
}

async function rebuildFlatRowsForDay(day: string, payload: UnknownObject): Promise<void> {
	const knex = getKnex();
	await knex('box_tariffs_rows').where({ day }).del();
	const rows = extractRows(payload).map((r) => ({ day, ...r }));
	if (rows.length) {
		await knex.batchInsert('box_tariffs_rows', rows, 1000);
	}
}


