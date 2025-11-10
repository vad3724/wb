/** @type {import('knex').Knex.Config} */
module.exports = {
	client: 'pg',
	migrations: {
		directory: './dist/migrations',
		extension: 'js'
	},
	connection: {
		host: process.env.DB_HOST || 'db',
		port: +(process.env.DB_PORT || 5432),
		database: process.env.DB_NAME || 'postgres',
		user: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres'
	}
};


