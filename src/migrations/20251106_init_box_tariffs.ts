import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('box_tariffs_daily', (t) => {
		t.date('day').notNullable().unique();
		t.jsonb('payload').notNullable();
		t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
	});

	await knex.schema.createTable('box_tariffs_rows', (t) => {
		t.bigIncrements('id').primary();
		t.date('day').notNullable().index();
		t.specificType('coefficient', 'numeric').nullable().index();
		t.text('region').nullable();
		t.text('warehouse').nullable();
		t.text('size').nullable();
		t.specificType('price', 'numeric').nullable();
		t.jsonb('raw').notNullable();
		t.unique(['day', 'id']);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('box_tariffs_rows');
	await knex.schema.dropTableIfExists('box_tariffs_daily');
}


