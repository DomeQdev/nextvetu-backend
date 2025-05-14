import { createClient } from "@clickhouse/client";

const db = createClient({ database: "nextvetu" });

export type Point = [number, number];

/**
CREATE TABLE IF NOT EXISTS nextvetu.places (
    id Int32,
    location Point,
    name String,
    place_number Int32,
    last_seen DateTime64(3, 'UTC'),
    geohash String MATERIALIZED geohashEncode(location.1, location.2, 7),

    INDEX idx_place_number place_number TYPE set(0) GRANULARITY 1,
    INDEX idx_geohash geohash TYPE bloom_filter(0.01) GRANULARITY 4,
    INDEX idx_place_name name TYPE bloom_filter(0.01) GRANULARITY 1
)
ENGINE = ReplacingMergeTree(last_seen)
PRIMARY KEY (id)
ORDER BY (id)
TTL toDateTime(last_seen + INTERVAL 2 HOUR + INTERVAL 30 MINUTE) DELETE
SETTINGS index_granularity = 8192;
*/

export type Place = {
    id: number;
    location: Point;
    name: string;
    place_number: number;
    last_seen: string;
};

/**
CREATE TABLE IF NOT EXISTS nextvetu.bikes (
    id String,
    bike_number String,
    type Int32,
    battery Nullable(Int32),
    place_id Int32,
    last_seen DateTime64(3, 'UTC'),

    INDEX idx_bike_place_id place_id TYPE set(0) GRANULARITY 1,
    INDEX idx_bike_type type TYPE set(0) GRANULARITY 1,
    INDEX idx_bike_bike_number bike_number TYPE bloom_filter(0.001) GRANULARITY 1
)
ENGINE = ReplacingMergeTree(last_seen)
PRIMARY KEY (id)
ORDER BY (id)
TTL toDateTime(last_seen + INTERVAL 2 HOUR + INTERVAL 30 MINUTE) DELETE
SETTINGS index_granularity = 8192;
*/

export type Bike = {
    id: string; // Boardcomputer ID
    bike_number: string; // User-visible bike number, zmiana z 'number' na 'bike_number' w typie
    type: number;
    battery: number | null;
    place_id: number;
    last_seen: string;
};

/**
CREATE TABLE IF NOT EXISTS nextvetu.rentals (
    id String,
    bike_number String,
    bike_type Int32,
    start_location Point,
    end_location Point,
    start_name String,
    end_name String,
    start_time DateTime64(3, 'UTC'),
    end_time DateTime64(3, 'UTC'),
    battery_start Nullable(Int32),
    battery_end Nullable(Int32),

    INDEX idx_rental_start_name start_name TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_rental_end_name end_name TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_rental_bike_type bike_type TYPE set(0) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(start_time)
PRIMARY KEY (start_time, bike_number, id)
ORDER BY (start_time, bike_number, id)
TTL toDateTime(start_time + INTERVAL 1 YEAR) DELETE
SETTINGS index_granularity = 8192;
*/

export type Rental = {
    id: string;
    bike_number: string;
    bike_type: number;
    start_location: Point;
    end_location: Point;
    start_name: string;
    end_name: string;
    start_time: string;
    end_time: string;
    battery_start: number | null;
    battery_end: number | null;
};

export const dbSelect = async <T>(query: string, query_params?: Record<string, any>): Promise<T[]> => {
    return db
        .query({
            query,
            query_params,
            format: "JSON",
        })
        .then((res) => res.json<T>())
        .then(({ data }) => data);
};

export const dbInsert = async <T>(table: string, values: T[]) => {
    if (!values.length) return;

    return db.insert({
        table,
        values,
        format: "JSONEachRow",
    });
};

export const dateToString = (date: Date) => date.toISOString().replace("T", " ").replace("Z", "");
export const stringToDate = (date: string) => new Date(date.replace(" ", "T") + "Z");

export default db;
