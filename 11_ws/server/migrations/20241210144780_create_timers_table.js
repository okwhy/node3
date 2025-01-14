/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("timers", function (table) {
    table.bigIncrements("id").primary();
    table.text("description");
    table.boolean("isActive").defaultTo(false).notNullable();
    table.bigInteger("duration");
    table.bigInteger("start").notNullable();
    table.bigInteger("end");
    table.integer("user_id").notNullable().references("id").inTable("users");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("timers");
};
