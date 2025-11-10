import knexFactory, { Knex } from 'knex';
import { env } from '../utils/env.js';

let knexInstance: Knex | null = null;

export function getKnex(): Knex {
	if (!knexInstance) {
		knexInstance = knexFactory({
			client: 'pg',
			connection: {
				host: env.DB_HOST,
				port: env.DB_PORT,
				database: env.DB_NAME,
				user: env.DB_USER,
				password: env.DB_PASSWORD,
			},
			pool: { min: 0, max: 10 },
		});
	}
	return knexInstance;
}


