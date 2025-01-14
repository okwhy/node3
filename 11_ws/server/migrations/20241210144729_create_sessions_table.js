/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("sessions", function (table) {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table.string("token").notNullable().unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("sessions");
};
