import dotenv from 'dotenv';
dotenv.config();

const required = (value: string | undefined, name: string) => {
	if (value === undefined) {
		throw new Error(`Missing required env: ${name}`);
	}
	return value;
};

export const env = {
	WB_BOX_TARIFFS_ENDPOINT:
		process.env.WB_BOX_TARIFFS_ENDPOINT ||
		'https://common-api.wildberries.ru/api/v1/tariffs/box',
	WB_API_TOKEN: process.env.WB_API_TOKEN,
	WB_AUTH_HEADER: process.env.WB_AUTH_HEADER || 'Authorization',
	WB_AUTH_SCHEME: process.env.WB_AUTH_SCHEME || 'Bearer',
	DB_HOST: required(process.env.DB_HOST, 'DB_HOST'),
	DB_PORT: Number(process.env.DB_PORT || 5432),
	DB_NAME: required(process.env.DB_NAME, 'DB_NAME'),
	DB_USER: required(process.env.DB_USER, 'DB_USER'),
	DB_PASSWORD: required(process.env.DB_PASSWORD, 'DB_PASSWORD'),
	// Comma-separated Google Sheets IDs
	G_SHEETS_IDS: (process.env.G_SHEETS_IDS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean),
	G_SHEETS_TAB: process.env.G_SHEETS_TAB || 'stocks_coefs',
	GOOGLE_SA_EMAIL: process.env.GOOGLE_SA_EMAIL,
	GOOGLE_SA_PRIVATE_KEY: process.env.GOOGLE_SA_PRIVATE_KEY,
};


