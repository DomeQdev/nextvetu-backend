import { relations } from "drizzle-orm";
import {
    foreignKey,
    geometry,
    index,
    integer,
    pgTable,
    primaryKey,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const placeTable = pgTable(
    "places",
    {
        id: integer().notNull(),
        location: geometry({ type: "point", mode: "tuple", srid: 4326 }).notNull(),
        name: text().notNull(),
        number: integer().notNull(),
        last_seen: timestamp({ withTimezone: true }).notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.id] }),
        index("placeLocationIndex").using("gist", table.location),
        index("placeLastSeenIndex").on(table.last_seen),
    ]
);

export const bikeTable = pgTable(
    "bikes",
    {
        id: text().notNull(),
        number: text().notNull(),
        type: integer().notNull(),
        battery: integer(),
        place: integer().notNull(),
        last_seen: timestamp({ withTimezone: true }).notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.id] }),
        index("bikePlaceIndex").on(table.place),
        index("bikeTypeIndex").on(table.type),
        index("bikeLastSeenIndex").on(table.last_seen),
        foreignKey({ columns: [table.place], foreignColumns: [placeTable.id] }),
    ]
);

export const rentalTable = pgTable(
    "rentals",
    {
        id: text().notNull(),
        bike: text().notNull(),
        bike_type: integer().notNull(),
        start_location: geometry({ type: "point", mode: "tuple", srid: 4326 }).notNull(),
        end_location: geometry({ type: "point", mode: "tuple", srid: 4326 }).notNull(),
        start_name: text().notNull(),
        end_name: text().notNull(),
        start: timestamp({ withTimezone: true }).notNull(),
        end: timestamp({ withTimezone: true }).notNull(),
        battery_start: integer(),
        battery_end: integer(),
    },
    (table) => [
        primaryKey({ columns: [table.id] }),
        index("rentalBikeIndex").on(table.bike),
        index("rentalStartIndex").on(table.start),
    ]
);

export const bikeRelations = relations(bikeTable, ({ one }) => ({
    place: one(placeTable, {
        fields: [bikeTable.place],
        references: [placeTable.id],
    }),
}));

export const placeRelations = relations(placeTable, ({ many }) => ({
    bikes: many(bikeTable),
}));

export type Bike = typeof bikeTable.$inferSelect;
export type Place = typeof placeTable.$inferSelect;
export type Rental = typeof rentalTable.$inferSelect;
